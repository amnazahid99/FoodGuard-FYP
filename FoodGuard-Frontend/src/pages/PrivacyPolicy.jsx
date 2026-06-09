import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  Cookie,
  Mail,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function PrivacyPolicy() {
  const { c, isDark } = useTheme();

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      body: [
        'We collect information you provide directly to us when you create an account, add items to your inventory, scan receipts, or contact our support team. This includes your name, email address, household preferences, and food inventory data.',
        'We also automatically collect usage data such as device type, browser version, IP address, and how you interact with the app to help us improve the experience.',
      ],
    },
    {
      icon: Eye,
      title: '2. How We Use Your Information',
      body: [
        'Your information powers the core FoodGuard experience: tracking your inventory, sending expiry alerts, generating personalized recipes, and producing nutrition insights.',
        'We also use aggregated, anonymized data to improve our AI models, identify product trends, and make the platform more useful for everyone. We never sell your personal data.',
      ],
    },
    {
      icon: Lock,
      title: '3. Data Security',
      body: [
        'We use industry-standard encryption (TLS in transit, AES-256 at rest) to protect your data. Access to production systems is limited to authorized engineers and audited regularly.',
        'While no system is 100% secure, we work hard to apply best practices and respond quickly to any security concerns reported through security@foodguard.app.',
      ],
    },
    {
      icon: UserCheck,
      title: '4. Your Rights & Choices',
      body: [
        'You can access, update, or delete your data at any time from your account settings. You can also export a copy of your information in a machine-readable format.',
        'If you live in a jurisdiction with additional data protection laws (e.g. GDPR, CCPA), you have additional rights including the right to object, restrict processing, and lodge a complaint with a supervisory authority.',
      ],
    },
    {
      icon: Cookie,
      title: '5. Cookies & Tracking',
      body: [
        'We use a small number of essential cookies to keep you signed in and remember your preferences. We use privacy-friendly analytics to understand how the app is used in aggregate.',
        'You can control cookies through your browser settings. Disabling essential cookies may affect core functionality.',
      ],
    },
    {
      icon: Mail,
      title: '6. Contacting Us',
      body: [
        'If you have any questions about this Privacy Policy or how we handle your data, please contact us at privacy@foodguard.app or through our Contact page.',
        'We aim to respond to all privacy-related inquiries within 5 business days.',
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
              <ShieldCheck className="w-4 h-4" />
              Legal
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ color: c.textPrimary }}
            >
              Privacy <span style={{ color: c.teal }}>Policy</span>
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed mb-2"
              style={{ color: c.textSecondary }}
            >
              Your trust matters. Here's exactly how we handle your data.
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
              Have questions about your privacy?
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-white hover:underline"
            >
              Contact our team →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
