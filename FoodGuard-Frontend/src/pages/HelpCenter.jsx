import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  LifeBuoy,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/Accordion';

export function HelpCenter() {
  const { c, isDark } = useTheme();
  const [query, setQuery] = useState('');

  const faqs = [
    {
      question: 'How do I add items to my inventory?',
      answer:
        'You can add items in three ways: manually from the Inventory page, by scanning a barcode with your phone camera, or by uploading a grocery receipt for automatic OCR-based import.',
    },
    {
      question: 'How do I change my notification preferences?',
      answer:
        'Go to Settings → Notifications. You can choose to receive alerts via email, push notifications, or both, and configure how many days before expiry you want to be notified.',
    },
    {
      question: 'Can I share my inventory with my family?',
      answer:
        'Yes. From Settings → Household, you can invite up to 5 family members to share a single inventory. Each member has their own login but sees the same items.',
    },
    {
      question: 'How accurate are the expiry date predictions?',
      answer:
        'Our AI is trained on thousands of products and uses storage type, purchase date, and product category to estimate expiry. You can always edit predicted dates manually if you have better information.',
    },
    {
      question: 'Is my data backed up?',
      answer:
        'Yes — your inventory and account data are backed up daily and stored in encrypted, geo-redundant storage. You can also export a full data dump from Settings → Data at any time.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer:
        'Go to Settings → Billing and click "Cancel Subscription". You\'ll keep access to paid features until the end of your current billing period.',
    },
    {
      question: 'I forgot my password. What should I do?',
      answer:
        'Click "Forgot password?" on the login screen and enter your email. You\'ll receive a secure link to reset your password within a few minutes.',
    },
    {
      question: 'Does FoodGuard work offline?',
      answer:
        'You can view your inventory offline in our mobile app. Changes sync automatically once you reconnect. AI features (recipes, predictions) require an internet connection.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(query.toLowerCase()) ||
      f.answer.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen" style={{ background: c.pageBg }}>
      {/* ─── Hero + Search ─────────────────────────────────────────────── */}
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
              <LifeBuoy className="w-4 h-4" />
              Help Center
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
              style={{ color: c.textPrimary }}
            >
              How can we <span style={{ color: c.teal }}>help?</span>
            </h1>
            <p
              className="text-base sm:text-lg leading-relaxed mb-8"
              style={{ color: c.textSecondary }}
            >
              Search our knowledge base or browse popular topics below.
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: c.textSecondary }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, guides, FAQs..."
                className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-full text-sm sm:text-base focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: c.inputBg,
                  border: `1px solid ${c.inputBorder}`,
                  color: c.inputText || c.textPrimary,
                }}
              />
            </div>
          </motion.div>
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
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-12"
          >
            <h2
              className="text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: c.textPrimary }}
            >
              Frequently Asked Questions
            </h2>
            <p
              className="text-base sm:text-lg"
              style={{ color: c.textSecondary }}
            >
              {query
                ? `${filteredFaqs.length} result${
                    filteredFaqs.length === 1 ? '' : 's'
                  } for "${query}"`
                : 'Quick answers to the questions we hear most.'}
            </p>
          </motion.div>

          {filteredFaqs.length > 0 ? (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                boxShadow: c.cardShadow,
              }}
            >
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, i) => (
                  <div
                    key={i}
                    style={{
                      borderBottom:
                        i === filteredFaqs.length - 1
                          ? 'none'
                          : `1px solid ${c.divider}`,
                    }}
                  >
                    <AccordionItem
                      value={`faq-${i}`}
                      className="px-4 sm:px-6"
                    >
                      <AccordionTrigger className="py-4 sm:py-5">
                        <span
                          className="text-sm sm:text-base font-semibold"
                          style={{
                            color: isDark
                              ? c.textPrimary
                              : c.textOnCardPrimary,
                          }}
                        >
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 sm:pb-5">
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            color: isDark
                              ? c.textSecondary
                              : c.textOnCardSecondary,
                          }}
                        >
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                ))}
              </Accordion>
            </div>
          ) : (
            <div
              className="p-8 rounded-2xl text-center"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                boxShadow: c.cardShadow,
              }}
            >
              <p
                className="text-sm sm:text-base"
                style={{
                  color: isDark ? c.textSecondary : c.textOnCardSecondary,
                }}
              >
                No articles found. Try different keywords or contact support.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Still Need Help ───────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-10 lg:p-12 rounded-3xl text-center"
            style={{
              background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
              boxShadow: c.cardShadow,
            }}
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white opacity-90" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
              Still need help?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Our support team is here to help. Reach out and we'll get back to
              you within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/contact">
                <Button variant="white" size="lg" className="w-full sm:w-auto">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <a href="mailto:support@foodguard.app">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30"
                >
                  Email Us Directly
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
