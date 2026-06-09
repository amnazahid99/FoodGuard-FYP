const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { getStripe } = require('../utils/stripe');
const { PLAN_PRICING, CURRENCY, PAID_PLANS, BILLING_CYCLES, unitAmountFor } = require('../config/plans');

// success/cancel redirects go back to the frontend (first CLIENT_URL entry)
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();

// When should a freshly-paid plan expire? We compute it ourselves.
function planPeriodEnd(billing) {
  const d = new Date();
  if (billing === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

// Activate a plan from a PAID Checkout Session. Idempotent on the session id,
// so /confirm and the (optional) webhook can both run without double-counting.
async function activateFromSession(user, session) {
  if (!user || !session) return;
  if (session.payment_status !== 'paid') return;
  if (user.subscription && user.subscription.lastPaymentId === session.id) return;

  const plan = session.metadata && session.metadata.plan;
  const billing = (session.metadata && session.metadata.billing) || 'monthly';
  if (!PAID_PLANS.includes(plan)) return;

  user.plan = plan;
  user.subscription = {
    status: 'active',
    billing,
    currentPeriodEnd: planPeriodEnd(billing),
    lastPaymentId: session.id,
  };
  if (session.customer) user.stripeCustomerId = session.customer;
  await user.save();
}

// POST /api/billing/checkout (protected) — one-time payment via inline price_data.
// Body: { plan: 'pro'|'family', billing: 'monthly'|'yearly' }
exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { plan, billing = 'monthly' } = req.body || {};
  if (!PAID_PLANS.includes(plan)) { res.status(400); throw new Error('Invalid plan'); }
  if (!BILLING_CYCLES.includes(billing)) { res.status(400); throw new Error('Invalid billing cycle'); }

  const unitAmount = unitAmountFor(plan, billing);
  if (!unitAmount) { res.status(500); throw new Error(`No price configured for ${plan}/${billing}`); }

  // Reuse/create a Stripe customer (nice for receipts + webhook fallback lookup).
  let customerId = req.user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: req.user.email,
      name: req.user.name,
      metadata: { userId: String(req.user._id) },
    });
    customerId = customer.id;
    req.user.stripeCustomerId = customerId;
    await req.user.save();
  }

  const label = PLAN_PRICING[plan].label;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: CURRENCY,
        unit_amount: unitAmount,                 // smallest unit (paisa/cents)
        product_data: { name: `FoodGuard ${label} — ${billing}` },
      },
    }],
    client_reference_id: String(req.user._id),
    metadata: { userId: String(req.user._id), plan, billing },
    payment_intent_data: { metadata: { userId: String(req.user._id), plan, billing } },
    success_url: `${CLIENT_URL}/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${CLIENT_URL}/pricing?billing=cancelled`,
  });

  res.json({ url: session.url });
});

// POST /api/billing/confirm (protected) — activate after Stripe redirects back.
// This makes the webhook optional for local dev. Body: { sessionId }
exports.confirmCheckout = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { sessionId } = req.body || {};
  if (!sessionId) { res.status(400); throw new Error('Missing sessionId'); }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (String(session.client_reference_id) !== String(req.user._id)) {
    res.status(403); throw new Error('This checkout session does not belong to you');
  }
  if (session.payment_status !== 'paid') {
    res.status(402); throw new Error('Payment not completed');
  }
  await activateFromSession(req.user, session);
  res.json({ plan: req.user.plan, subscription: req.user.subscription });
});

// POST /api/billing/webhook (public, RAW body — mounted before express.json in app.js).
// Optional backup to /confirm; handles the "user closed the tab before redirect" case.
exports.webhook = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const userId = (s.metadata && s.metadata.userId) || s.client_reference_id;
      let user = await User.findById(userId).catch(() => null);
      if (!user && s.customer) user = await User.findOne({ stripeCustomerId: s.customer });
      await activateFromSession(user, s);
    }
  } catch (e) {
    // Never 500 a webhook for a downstream error — log and ack so Stripe doesn't retry-spam.
    console.error('[stripe webhook] handler error:', e.message);
  }
  res.json({ received: true });
});
