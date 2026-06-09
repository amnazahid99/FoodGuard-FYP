/**
 * Plan catalogue — single source of truth for tier limits and the (hard-coded)
 * prices we charge.
 *
 * We do NOT create Products/Prices in Stripe. Checkout uses inline `price_data`
 * built from PLAN_PRICING below, and we compute the plan expiry ourselves
 * (now + 1 month / 1 year) when the one-time payment succeeds.
 *
 * Keep these amounts in sync with the prices shown on the Pricing/Landing pages.
 */

// Per-plan feature limits. Infinity = unlimited (no enforcement).
const PLAN_LIMITS = {
  free: { items: 30, recipesPerWeek: 5 },
  pro: { items: Infinity, recipesPerWeek: Infinity },
  family: { items: Infinity, recipesPerWeek: Infinity },
};

// Hard-coded prices in whole rupees, per plan + billing cycle.
const PLAN_PRICING = {
  pro: { label: 'Pro', monthly: 499, yearly: 4990 },
  family: { label: 'Family', monthly: 899, yearly: 8990 },
};

// Charge currency. Defaults to PKR to match the ₨ UI; set STRIPE_CURRENCY=usd
// in .env if your Stripe test account rejects PKR as a presentment currency.
const CURRENCY = (process.env.STRIPE_CURRENCY || 'pkr').toLowerCase();

const PAID_PLANS = ['pro', 'family'];
const BILLING_CYCLES = ['monthly', 'yearly'];

// Amount in the currency's smallest unit (paisa/cents) that Stripe expects.
function unitAmountFor(plan, billing) {
  const p = PLAN_PRICING[plan];
  if (!p || !p[billing]) return null;
  return Math.round(p[billing] * 100);
}

module.exports = { PLAN_LIMITS, PLAN_PRICING, CURRENCY, PAID_PLANS, BILLING_CYCLES, unitAmountFor };
