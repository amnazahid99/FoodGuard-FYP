import { useState } from 'react';
import settingsService from '../services/settings.service';
import { useNotifications } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';

export function Contact() {
  const { c, isDark } = useTheme();
  const { notify } = useNotifications();
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await settingsService.submitContact(form);
      setSubmitted(true);
      notify('Message sent! We will get back to you soon.', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      setError(err.message || 'Could not send your message. Please try again.');
      notify('Failed to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const channels = [
    {
      icon: Mail,
      title: 'Email Us',
      detail: 'support@foodguard.app',
      sub: 'We reply within 24 hours',
    },
    {
      icon: Phone,
      title: 'Call Us',
      detail: '+92 300 123 4567',
      sub: 'Mon–Fri, 9am – 6pm PKT',
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      detail: 'Plot 42, Tech District',
      sub: 'Karachi, Pakistan',
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      detail: 'Chat with our team',
      sub: 'Available in-app, 24/7',
    },
  ];

  const socials = [
    { icon: Facebook,  href: '#' },
    { icon: Twitter,   href: '#' },
    { icon: Instagram, href: '#' },
    { icon: Youtube,   href: '#' },
  ];

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
              <MessageSquare className="w-4 h-4" />
              Get In Touch
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: c.textPrimary }}
            >
              We'd love to <span style={{ color: c.teal }}>hear from you</span>
            </h1>
            <p
              className="text-base sm:text-lg lg:text-xl leading-relaxed"
              style={{ color: c.textSecondary }}
            >
              Questions about FoodGuard? Feedback on a feature? Partnership
              ideas? Reach out — our team responds to every message.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Channels ──────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {channels.map((channel, i) => {
              const Icon = channel.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl"
                  style={{
                    background: c.cardBg,
                    border: `1px solid ${c.border}`,
                    boxShadow: c.cardShadow,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: c.tagBg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: c.teal }} />
                  </div>
                  <h3
                    className="text-base sm:text-lg font-semibold mb-1"
                    style={{
                      color: isDark ? c.textPrimary : c.textOnCardPrimary,
                    }}
                  >
                    {channel.title}
                  </h3>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: c.teal }}
                  >
                    {channel.detail}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color: isDark ? c.textSecondary : c.textOnCardSecondary,
                    }}
                  >
                    {channel.sub}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Form + Sidebar ────────────────────────────────────────────── */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* ── Form ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 p-6 sm:p-8 lg:p-10 rounded-2xl"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                boxShadow: c.cardShadow,
              }}
            >
              <h2
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{
                  color: isDark ? c.textPrimary : c.textOnCardPrimary,
                }}
              >
                Send us a message
              </h2>
              <p
                className="text-sm sm:text-base mb-6 sm:mb-8"
                style={{
                  color: isDark ? c.textSecondary : c.textOnCardSecondary,
                }}
              >
                Fill out the form below and we'll get back to you as soon as
                possible.
              </p>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 sm:p-8 rounded-xl text-center"
                  style={{
                    background: c.tagBg,
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <CheckCircle2
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: c.teal }}
                  />
                  <h3
                    className="text-lg font-semibold mb-1"
                    style={{
                      color: isDark ? c.textPrimary : c.textOnCardPrimary,
                    }}
                  >
                    Message sent!
                  </h3>
                  <p
                    className="text-sm"
                    style={{
                      color: isDark ? c.textSecondary : c.textOnCardSecondary,
                    }}
                  >
                    Thanks for reaching out — we'll be in touch within 24
                    hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{
                          color: isDark
                            ? c.textPrimary
                            : c.textOnCardPrimary,
                        }}
                      >
                        Full Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                          background: c.inputBg,
                          border: `1px solid ${c.inputBorder}`,
                          color: c.inputText || c.textPrimary,
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-medium mb-2"
                        style={{
                          color: isDark
                            ? c.textPrimary
                            : c.textOnCardPrimary,
                        }}
                      >
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{
                          background: c.inputBg,
                          border: `1px solid ${c.inputBorder}`,
                          color: c.inputText || c.textPrimary,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{
                        color: isDark ? c.textPrimary : c.textOnCardPrimary,
                      }}
                    >
                      Subject
                    </label>
                    <select
                      name="subject"
                      required
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${c.inputBorder}`,
                        color: c.inputText || c.textPrimary,
                      }}
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="feedback">Product Feedback</option>
                      <option value="partnership">Partnerships</option>
                      <option value="press">Press &amp; Media</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{
                        color: isDark ? c.textPrimary : c.textOnCardPrimary,
                      }}
                    >
                      Your Message
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      className="w-full px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${c.inputBorder}`,
                        color: c.inputText || c.textPrimary,
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </motion.div>

            {/* ── Sidebar ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              {/* Hours */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.border}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: c.tagBg }}
                  >
                    <Clock className="w-5 h-5" style={{ color: c.teal }} />
                  </div>
                  <h3
                    className="text-base sm:text-lg font-semibold"
                    style={{
                      color: isDark ? c.textPrimary : c.textOnCardPrimary,
                    }}
                  >
                    Office Hours
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    ['Monday – Friday', '9:00 AM – 6:00 PM'],
                    ['Saturday',         '10:00 AM – 4:00 PM'],
                    ['Sunday',           'Closed'],
                  ].map(([day, time], i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-3"
                      style={{
                        color: isDark
                          ? c.textSecondary
                          : c.textOnCardSecondary,
                      }}
                    >
                      <span>{day}</span>
                      <span className="font-medium">{time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Socials */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.border}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <h3
                  className="text-base sm:text-lg font-semibold mb-2"
                  style={{
                    color: isDark ? c.textPrimary : c.textOnCardPrimary,
                  }}
                >
                  Follow Us
                </h3>
                <p
                  className="text-sm mb-4"
                  style={{
                    color: isDark ? c.textSecondary : c.textOnCardSecondary,
                  }}
                >
                  Stay updated with tips, recipes, and product news.
                </p>
                <div className="flex items-center gap-3">
                  {socials.map(({ icon: Icon, href }, i) => (
                    <a
                      key={i}
                      href={href}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                      style={{
                        background: c.tagBg,
                        border: `1px solid ${c.border}`,
                        color: c.teal,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = c.teal;
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = c.tagBg;
                        e.currentTarget.style.color = c.teal;
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Help CTA */}
              <div
                className="p-6 rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                }}
              >
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                  Need quick answers?
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Browse our Help Center for guides, FAQs, and troubleshooting
                  tips.
                </p>
                <Link
                  to="/help-center"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:underline"
                >
                  Visit Help Center →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
