import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, HelpCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import billingService from '../services/billing.service';
import { Button } from '../components/ui/Button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/Accordion';

export function Pricing() {
  const { c, isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState('monthly');
  const [busy, setBusy] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('billing') === 'cancelled') {
      setCheckoutError('Checkout cancelled — you have not been charged.');
    }
  }, []);

  // Free → signup/dashboard; paid → Stripe Checkout (login first if needed).
  const onSelect = async (plan) => {
    setCheckoutError(null);
    if (plan.id === 'free') { navigate(isAuthenticated ? '/dashboard' : '/signup'); return; }
    if (!isAuthenticated) { navigate(`/login?from=${encodeURIComponent('/pricing')}`); return; }
    try {
      setBusy(plan.id);
      await billingService.startCheckout({ plan: plan.id, billing });
    } catch (e) {
      setCheckoutError(e.message || 'Could not start checkout. Please try again.');
      setBusy(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      Icon: Sparkles,
      tagline: 'Perfect for getting started',
      monthly: 0,
      yearly: 0,
      cta: 'Start Free',
      ctaTo: '/signup',
      featured: false,
      features: [
        'Up to 30 inventory items',
        'Basic expiry alerts (email only)',
        '5 AI recipe suggestions / week',
        'Single user',
        'Community support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      Icon: Zap,
      tagline: 'For serious home cooks',
      monthly: 499,
      yearly: 4990,
      cta: 'Start Pro Trial',
      ctaTo: '/signup',
      featured: true,
      features: [
        'Unlimited inventory items',
        'Smart expiry alerts (email + push)',
        'Unlimited AI recipe suggestions',
        'Receipt & barcode scanning',
        'Nutrition insights',
        'Priority email support',
      ],
    },
    {
      id: 'family',
      name: 'Family',
      Icon: Crown,
      tagline: 'Share with up to 5 people',
      monthly: 899,
      yearly: 8990,
      cta: 'Start Family Plan',
      ctaTo: '/signup',
      featured: false,
      features: [
        'Everything in Pro',
        'Up to 5 family members',
        'Shared inventory & shopping lists',
        'Family meal planning',
        'Personalized nutrition per member',
        'Priority chat support',
      ],
    },
  ];

  const faqs = [
    {
      q: 'Can I switch plans later?',
      a: 'Yes — you can upgrade, downgrade, or cancel anytime from your account settings. Changes take effect at the start of your next billing cycle.',
    },
    {
      q: 'Is there a free trial for paid plans?',
      a: 'Pro and Family plans both come with a 14-day free trial. No credit card required to start.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major credit/debit cards, PayPal, and local Pakistani payment methods including JazzCash and EasyPaisa.',
    },
    {
      q: 'Do you offer refunds?',
      a: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not happy, just email us and we'll process a full refund.",
    },
    {
      q: 'Is my payment information secure?',
      a: 'Absolutely. All payments are processed through PCI-compliant providers (Stripe). We never store your card details on our servers.',
    },
  ];

  const cardBase = {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.cardShadow,
  };
  const onCardPrimary = isDark ? c.textPrimary : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  return (
    <div className="relative min-h-screen" style={{ background: c.pageBg }}>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: c.heroBg }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs sm:text-sm font-medium"
              style={{
                background: c.tagBg,
                color: c.tagColor,
                border: `1px solid ${c.border}`,
              }}
            >
              <Sparkles className="w-4 h-4" />
              Pricing
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: c.textPrimary }}
            >
              Simple plans for{' '}
              <span style={{ color: c.teal }}>every kitchen</span>
            </h1>
            <p
              className="text-base sm:text-lg lg:text-xl leading-relaxed"
              style={{ color: c.textSecondary }}
            >
              Start free. Upgrade when your kitchen demands it. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full mt-8"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
              }}
            >
              <button
                onClick={() => setBilling('monthly')}
                className="px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors"
                style={{
                  background: billing === 'monthly' ? c.teal : 'transparent',
                  color: billing === 'monthly' ? '#FFFFFF' : onCardSecondary,
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className="px-4 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                style={{
                  background: billing === 'yearly' ? c.teal : 'transparent',
                  color: billing === 'yearly' ? '#FFFFFF' : onCardSecondary,
                }}
              >
                Yearly
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background:
                      billing === 'yearly'
                        ? 'rgba(255,255,255,0.2)'
                        : c.tagBg,
                    color: billing === 'yearly' ? '#FFFFFF' : c.teal,
                  }}
                >
                  Save 17%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Plans ─────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {checkoutError && (
            <p className="text-center text-sm mb-6 font-medium" style={{ color: '#ef4444' }}>
              {checkoutError}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => {
              const Icon = plan.Icon;
              const price = billing === 'monthly' ? plan.monthly : plan.yearly;
              const suffix = billing === 'monthly' ? '/mo' : '/yr';
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative rounded-2xl p-6 sm:p-8 flex flex-col"
                  style={
                    plan.featured
                      ? {
                          background: c.cardBg,
                          border: `2px solid ${c.teal}`,
                          boxShadow: `0 0 40px ${c.teal}33, ${c.cardShadow}`,
                        }
                      : cardBase
                  }
                >
                  {plan.featured && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: c.tagBg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: c.teal }} />
                    </div>
                    <div>
                      <h3
                        className="text-lg sm:text-xl font-bold"
                        style={{ color: onCardPrimary }}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: onCardSecondary }}
                      >
                        {plan.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-3xl sm:text-4xl font-bold"
                        style={{ color: onCardPrimary }}
                      >
                        {price === 0 ? 'Free' : `Rs. ${price.toLocaleString()}`}
                      </span>
                      {price > 0 && (
                        <span
                          className="text-sm"
                          style={{ color: onCardSecondary }}
                        >
                          {suffix}
                        </span>
                      )}
                    </div>
                    {billing === 'yearly' && plan.monthly > 0 && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: c.teal }}
                      >
                        Billed yearly · Rs. {Math.round(plan.yearly / 12)}/mo equivalent
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-sm"
                        style={{ color: onCardSecondary }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: c.tagBg }}
                        >
                          <Check
                            className="w-3 h-3"
                            style={{ color: c.teal }}
                          />
                        </div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    variant={plan.featured ? 'default' : 'outline'}
                    className="w-full mt-auto"
                    onClick={() => onSelect(plan)}
                    disabled={busy === plan.id}
                  >
                    {busy === plan.id ? 'Redirecting…' : plan.cta}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQs ──────────────────────────────────────────────────────── */}
      <section
        className="py-12 sm:py-16 lg:py-20"
        style={{ background: isDark ? 'transparent' : c.sectionBgAlt }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
              style={{ background: c.tagBg, color: c.tagColor }}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              FAQs
            </div>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: c.textPrimary }}
            >
              Pricing Questions
            </h2>
            <p
              className="text-base sm:text-lg"
              style={{ color: c.textSecondary }}
            >
              Everything you need to know before choosing a plan.
            </p>
          </motion.div>

          <div
            className="rounded-2xl overflow-hidden"
            style={cardBase}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  style={{
                    borderBottom:
                      i === faqs.length - 1
                        ? 'none'
                        : `1px solid ${c.divider}`,
                  }}
                >
                  <AccordionItem value={`faq-${i}`} className="px-4 sm:px-6">
                    <AccordionTrigger className="py-4 sm:py-5">
                      <span
                        className="text-sm sm:text-base font-semibold"
                        style={{ color: onCardPrimary }}
                      >
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 sm:pb-5">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: onCardSecondary }}
                      >
                        {faq.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 sm:p-12 rounded-3xl text-center"
            style={{
              background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
            }}
          >
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Ready to stop wasting food?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of households saving money and reducing waste with
              FoodGuard. No credit card needed to get started.
            </p>
            <Link to="/signup">
              <Button variant="white" size="lg">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
