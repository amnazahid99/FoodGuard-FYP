import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield,
  Leaf,
  Sparkles,
  Users,
  Target,
  Heart,
  Award,
  Globe,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';

export function About() {
  const { c, isDark } = useTheme();

  const values = [
    {
      icon: Leaf,
      title: 'Sustainability First',
      description:
        'We believe every meal saved is a step toward a healthier planet. Reducing food waste is at the heart of everything we build.',
    },
    {
      icon: Sparkles,
      title: 'Powered by AI',
      description:
        'From smart expiry predictions to personalized recipe suggestions, AI helps families and businesses make smarter food choices.',
    },
    {
      icon: Heart,
      title: 'Built for Real Homes',
      description:
        'FoodGuard is designed for the realities of busy kitchens — quick scans, simple alerts, and recipes that work with what you already have.',
    },
    {
      icon: Shield,
      title: 'Privacy You Can Trust',
      description:
        'Your inventory and personal data are encrypted and never sold. We protect your information like you would.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Households' },
    { value: '2M+',  label: 'Meals Saved' },
    { value: '120+', label: 'Cities Worldwide' },
    { value: '98%',  label: 'Customer Satisfaction' },
  ];

  const team = [
    {
      name: 'Ayesha Khan',
      role: 'Co-Founder & CEO',
      bio: 'Former sustainability consultant passionate about closing the food-waste loop with technology.',
    },
    {
      name: 'Ahmed Hassan',
      role: 'Co-Founder & CTO',
      bio: 'AI engineer who has spent a decade building intelligent systems for consumer apps.',
    },
    {
      name: 'Fatima Malik',
      role: 'Head of Product',
      bio: 'Product designer focused on building delightful, accessible experiences for everyday users.',
    },
    {
      name: 'Zayan Raza',
      role: 'Head of Nutrition',
      bio: 'Registered dietitian making sure every recipe and insight is grounded in real nutrition science.',
    },
  ];

  return (
    <div className="relative min-h-screen" style={{ background: c.pageBg }}>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: c.heroBg }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
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
              <Shield className="w-4 h-4" />
              About FoodGuard
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
              style={{ color: c.textPrimary }}
            >
              Smarter food. <span style={{ color: c.teal }}>Less waste.</span>{' '}
              Healthier living.
            </h1>
            <p
              className="text-base sm:text-lg lg:text-xl leading-relaxed"
              style={{ color: c.textSecondary }}
            >
              FoodGuard helps families and small businesses take control of
              their kitchens with AI-powered inventory management, expiry
              alerts, and personalized recipes — all designed to save money,
              time, and food.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Mission ───────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
                style={{ background: c.tagBg, color: c.tagColor }}
              >
                <Target className="w-3.5 h-3.5" />
                Our Mission
              </div>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight"
                style={{ color: c.textPrimary }}
              >
                A world where no good food goes to waste.
              </h2>
              <p
                className="text-base sm:text-lg leading-relaxed mb-4"
                style={{ color: c.textSecondary }}
              >
                Roughly one-third of all food produced globally is wasted, while
                millions struggle with rising grocery bills and unhealthy diets.
                We started FoodGuard to bridge that gap with technology that
                respects your time and your wallet.
              </p>
              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: c.textSecondary }}
              >
                Whether you're feeding a family of four or running a small
                restaurant, FoodGuard turns your inventory into actionable
                insights — so nothing expires forgotten in the back of the
                fridge.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4 sm:gap-6"
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="p-5 sm:p-6 rounded-2xl text-center"
                  style={{
                    background: c.cardBg,
                    border: `1px solid ${c.border}`,
                    boxShadow: c.cardShadow,
                  }}
                >
                  <div
                    className="text-3xl sm:text-4xl font-bold mb-2"
                    style={{ color: c.teal }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs sm:text-sm"
                    style={{
                      color: isDark ? c.textSecondary : c.textOnCardSecondary,
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Values ────────────────────────────────────────────────────── */}
      <section
        className="py-16 sm:py-20 lg:py-24"
        style={{ background: isDark ? 'transparent' : c.sectionBgAlt }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
              style={{ background: c.tagBg, color: c.tagColor }}
            >
              <Award className="w-3.5 h-3.5" />
              What We Stand For
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: c.textPrimary }}
            >
              Our Core Values
            </h2>
            <p
              className="text-base sm:text-lg"
              style={{ color: c.textSecondary }}
            >
              The principles that shape every feature we build and every
              decision we make.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl h-full"
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
                    className="text-lg sm:text-xl font-semibold mb-2"
                    style={{
                      color: isDark ? c.textPrimary : c.textOnCardPrimary,
                    }}
                  >
                    {value.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: isDark ? c.textSecondary : c.textOnCardSecondary,
                    }}
                  >
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Team ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-medium"
              style={{ background: c.tagBg, color: c.tagColor }}
            >
              <Users className="w-3.5 h-3.5" />
              Meet The Team
            </div>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: c.textPrimary }}
            >
              The people behind FoodGuard
            </h2>
            <p
              className="text-base sm:text-lg"
              style={{ color: c.textSecondary }}
            >
              A small, focused team of engineers, designers, and nutritionists
              building software we use ourselves every day.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.border}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <div
                  className="w-20 h-20 mx-auto rounded-full mb-4 flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                    color: '#FFFFFF',
                  }}
                >
                  {member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <h3
                  className="text-base sm:text-lg font-semibold mb-1"
                  style={{
                    color: isDark ? c.textPrimary : c.textOnCardPrimary,
                  }}
                >
                  {member.name}
                </h3>
                <div
                  className="text-xs sm:text-sm font-medium mb-3"
                  style={{ color: c.teal }}
                >
                  {member.role}
                </div>
                <p
                  className="text-xs sm:text-sm leading-relaxed"
                  style={{
                    color: isDark ? c.textSecondary : c.textOnCardSecondary,
                  }}
                >
                  {member.bio}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-12 lg:p-16 rounded-3xl text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
              boxShadow: c.cardShadow,
            }}
          >
            <Globe className="w-12 h-12 mx-auto mb-4 text-white opacity-90" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Join us in building a zero-waste future
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Start managing your kitchen smarter today. It's free to get
              started, and your fridge will thank you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/signup">
                <Button variant="white" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/30"
                >
                  Talk To Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
