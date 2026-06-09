import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  UserCircle2,
  Ban,
  CreditCard,
  AlertTriangle,
  Scale,
  Mail,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function TermsOfService() {
  const { c, isDark } = useTheme();

  const sections = [
    {
      icon: CheckCircle2,
      title: '1. Acceptance of Terms',
      body: [
        'By accessing or using FoodGuard ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.',
        'We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.',
      ],
    },
    {
      icon: UserCircle2,
      title: '2. Your Account',
      body: [
        'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.',
        'You must be at least 13 years old to use FoodGuard. Users under 18 should have parental consent. Provide accurate information when creating your account, and keep it up to date.',
      ],
    },
    {
      icon: Ban,
      title: '3. Acceptable Use',
      body: [
        'You agree not to misuse the Service. This includes (but is not limited to): attempting to access other users\' accounts, scraping the platform, reverse-engineering our AI models, uploading malicious content, or using FoodGuard for any unlawful purpose.',
        'We reserve the right to suspend or terminate accounts that violate these Terms or harm the FoodGuard community.',
      ],
    },
    {
      icon: CreditCard,
      title: '4. Subscriptions & Billing',
      body: [
        'FoodGuard offers a free tier and optional paid plans with additional features. Paid subscriptions are billed in advance on a recurring basis (monthly or annually) and are non-refundable except where required by law.',
        'You can cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.',
      ],
    },
    {
      icon: AlertTriangle,
      title: '5. Disclaimers',
      body: [
        'FoodGuard provides recipe suggestions, expiry estimates, and nutrition insights for informational purposes only. They are not a substitute for professional medical, dietary, or food-safety advice.',
        'Always use your own judgment when assessing food freshness and consult a qualified professional for medical or dietary decisions. The Service is provided "as is" without warranties of any kind.',
      ],
    },
    {
      icon: Scale,
      title: '6. Limitation of Liability',
      body: [
        'To the maximum extent permitted by law, FoodGuard and its affiliates will not be liable for any indirect, incidental, consequential, or punitive damages arising out of your use of the Service.',
        'Our total liability for any claim related to the Service will not exceed the amount you paid us in the 12 months prior to the claim.',
      ],
    },
    {
      icon: FileText,
      title: '7. Intellectual Property',
      body: [
        'All content, trademarks, and software associated with FoodGuard are owned by us or our licensors. You retain ownership of content you upload (such as inventory items and notes), but grant us a license to use it to operate and improve the Service.',
      ],
    },
    {
      icon: Mail,
      title: '8. Contact',
      body: [
        'Questions about these Terms? Reach us at legal@foodguard.app or via our Contact page. We typically respond within 5 business days.',
      ],
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ background: c.pageBg }}>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: c.heroBg }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs sm:text-sm font-medium"
              style={{
                background: c.tagBg,
                color: c.tagColor,
                border: `1px solid ${c.border}`,
              }}
            >
              <FileText className="w-4 h-4" />
              Legal
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ color: c.textPrimary }}
            >
              Terms of <span style={{ color: c.teal }}>Service</span>
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed mb-2"
              style={{ color: c.textSecondary }}
            >
              The ground rules for using FoodGuard, in plain language.
            </p>
            <p
              className="text-xs sm:text-sm"
              style={{ color: c.textMuted || c.textSecondary }}
            >
              Last updated: April 1, 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Sections ──────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="p-6 sm:p-8 rounded-2xl"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.border}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: c.tagBg }}
                  >
                    <Icon
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      style={{ color: c.teal }}
                    />
                  </div>
                  <h2
                    className="text-xl sm:text-2xl font-bold pt-1"
                    style={{
                      color: isDark ? c.textPrimary : c.textOnCardPrimary,
                    }}
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {section.body.map((para, j) => (
                    <p
                      key={j}
                      className="text-sm sm:text-base leading-relaxed"
                      style={{
                        color: isDark
                          ? c.textSecondary
                          : c.textOnCardSecondary,
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 sm:p-8 rounded-2xl text-center"
            style={{
              background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
            }}
          >
            <p className="text-sm sm:text-base text-white/95 mb-3">
              Need clarification on anything above?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:underline"
            >
              Contact our legal team →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
