import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleCanvas } from '../components/layout/ParticleCanvas';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import billingService from '../services/billing.service';
import {
  Bell,
  ChefHat,
  BarChart3,
  Warehouse,
  ChevronDown,
  Scan,
  Calendar,
  Utensils,
  PiggyBank,
  Play,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/Accordion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

export function Landing() {
  const [activeStep, setActiveStep] = useState(0);
  const { c, isDark } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(null);

  // Free → signup/dashboard; paid → Stripe Checkout (login first if needed).
  const onSelectPlan = async (planId) => {
    if (planId === 'free') { navigate(isAuthenticated ? '/dashboard' : '/signup'); return; }
    if (!isAuthenticated) { navigate(`/login?from=${encodeURIComponent('/pricing')}`); return; }
    try {
      setBusy(planId);
      await billingService.startCheckout({ plan: planId, billing: 'monthly' });
    } catch (e) {
      setBusy(null);
      navigate('/pricing');
    }
  };

  const features = [
    {
      icon: Bell,
      title: 'Smart Expiry Alerts',
      description:
        'Receive color-coded alerts so you never miss an expiry date',
      items: ['Milk: Expiring Soon', 'Strawberries: Expired'],
      color: 'text-[#1ABC9C]',
    },
    {
      icon: ChefHat,
      title: 'AI Recipe Suggestions',
      description:
        'Get meal ideas using soon-to-expire items and reduce waste smartly',
      image: 'https://images.unsplash.com/photo-1768203631866-a5d11b35bf0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwbWVhbCUyMGluZ3JlZGllbnRzJTIwY29va2luZ3xlbnwxfHx8fDE3NzE3MTI5OTV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'text-[#1ABC9C]',
    },
    {
      icon: BarChart3,
      title: 'Nutrition Insights',
      description:
        'Track your health & nutrients with tailored daily insights',
      image: 'https://images.unsplash.com/photo-1670698783848-5cf695a1b308?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudXRyaXRpb24lMjBmb29kJTIwY2hhcnQlMjBoZWFsdGh8ZW58MXx8fHwxNzcxNzEyOTk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'text-[#1ABC9C]',
    },
    {
      icon: Warehouse,
      title: 'Smart Inventory Management',
      description:
        'Easily add, track, and manage groceries with barcode & receipt scanning',
      image: 'https://images.unsplash.com/photo-1647980231285-f18523150ad3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc2hvcHBpbmclMjBiYXJjb2RlJTIwc2Nhbm5lcnxlbnwxfHx8fDE3NzE3MTI5OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
      color: 'text-[#1ABC9C]',
    },
  ];

  const testimonials = [
    {
      name: 'Ayesha Khan',
      quote:
        'FoodGuard has completely transformed how our family manages groceries. No more wasted food!',
      rating: 5,
    },
    {
      name: 'Ahmed Hassan',
      quote:
        'The AI recipe suggestions are brilliant. I save money and cook healthier meals.',
      rating: 5,
    },
    {
      name: 'Fatima Malik',
      quote:
        'As a small restaurant owner, this app helps me reduce waste and maximize profits.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'How does the AI Recipe Suggestion work?',
      answer:
        'Our AI analyzes your inventory, identifies items nearing expiry, and suggests creative recipes that use those ingredients. It considers Pakistani cuisine preferences and dietary requirements.',
    },
    {
      question: 'Can I scan grocery receipts directly?',
      answer:
        'Yes! FoodGuard uses advanced OCR technology to scan and automatically add items from your grocery receipts, complete with purchase dates and estimated expiry dates.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Absolutely. We use bank-level encryption to protect your data. Your inventory and personal information are stored securely and never shared with third parties.',
    },
    {
      question: 'How accurate are the expiry date predictions?',
      answer:
        'Our AI model is trained on thousands of food products and considers factors like storage conditions, product type, and purchase date to provide highly accurate expiry predictions.',
    },
    {
      question: 'Can I share my account with family members?',
      answer:
        'Yes! FoodGuard supports multi-user access, allowing family members or team members to collaborate on managing your shared inventory.',
    },
    {
      question: 'What devices is FoodGuard available on?',
      answer:
        'FoodGuard is available as a web application accessible from any device with a browser. Native mobile apps for iOS and Android are coming soon!',
    },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="relative">
      {/* ── HERO SECTION ── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
        style={{
          background: c.heroBg,
        }}
      >
        {/* LAYER 2 — Animated particle field */}
        <ParticleCanvas />

        {/* LAYER 3 — Large blurred glow orbs */}
        {/* Orb 1: top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-80px',
            left: '-80px',
            width: '500px',
            height: '500px',
            background: `radial-gradient(circle, ${c.orbColor1} 0%, transparent 70%)`,
            filter: 'blur(80px)',
            zIndex: 2,
          }}
        />
        {/* Orb 2: bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-60px',
            right: '-60px',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${c.orbColor2} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            zIndex: 2,
          }}
        />
        {/* Orb 3: center (very subtle) */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: `radial-gradient(circle, ${c.orbColor3} 0%, transparent 60%)`,
            filter: 'blur(100px)',
            zIndex: 2,
          }}
        />

        {/* ── Content: two-column layout ── */}
        <div className="relative max-w-7xl mx-auto px-6 w-full" style={{ zIndex: 10 }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-64px)] py-16 lg:py-0">

            {/* LEFT — Text content (unchanged words/styles, now left-aligned) */}
            <div className="flex flex-col items-start">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  background: c.tagBg,
                  color: c.tagColor,
                  border: isDark ? `1px solid rgba(26,188,156,0.25)` : `1px solid ${c.tagBorder}`,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: c.tagColor }} />
                AI-Powered Food Intelligence
              </motion.div>

              {/* Animated Tagline — 3 staggered lines */}
              <div className="mb-7">
                {[
                  { text: 'Smarter Food.',     color: isDark ? '#FFFFFF' : '#0A2318', delay: 0.2 },
                  { text: 'Healthier Living.', color: isDark ? '#1ABC9C' : '#0E9E82', delay: 0.6 },
                  { text: 'Zero Waste.',       color: isDark ? '#FFFFFF' : '#0A2318', delay: 1.0 },
                ].map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: line.delay, ease: 'easeOut' }}
                  >
                    <span
                      className="block font-bold leading-tight"
                      style={{
                        color: line.color,
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 'clamp(40px, 5.2vw, 64px)',
                      }}
                    >
                      {line.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.3, ease: 'easeOut' }}
                className="text-lg mb-9"
                style={{ color: isDark ? '#A8B2C1' : '#2D5A4E', fontFamily: 'Inter, sans-serif', maxWidth: '400px' }}
              >
                Trusted by households
              </motion.p>

              {/* Get Started Button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5, ease: 'easeOut' }}
                className="mb-9"
              >
                <Link to="/signup">
                  <motion.span
                    whileHover={{ scale: 1.04, boxShadow: isDark ? '0 8px 32px rgba(26,188,156,0.45)' : '0 0 20px rgba(14,158,130,0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-block text-white font-semibold text-base transition-all duration-200"
                    style={{
                      background: c.teal,
                      padding: '13px 32px',
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: isDark ? '0 4px 20px rgba(26,188,156,0.3)' : '0 0 20px rgba(14,158,130,0.4)',
                      borderRadius: '8px',
                    }}
                  >
                    Get Started
                  </motion.span>
                </Link>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.75, ease: 'easeOut' }}
                className="flex items-center gap-3 flex-wrap"
              >
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="w-px h-4" style={{ background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(14,158,130,0.25)' }} />
                <span className="text-sm font-bold" style={{ color: isDark ? '#FFFFFF' : '#1A4A3A', fontFamily: 'Inter, sans-serif' }}>
                  5,000+
                </span>
                <span className="text-sm" style={{ color: isDark ? '#A8B2C1' : '#2D5A4E', fontFamily: 'Inter, sans-serif' }}>
                  happy households
                </span>
              </motion.div>
            </div>

            {/* RIGHT — Floating 3D Dashboard Mockup */}
            <div className="hidden lg:flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
                style={{ perspective: '1000px' }}
              >
                {/* Outer floating + tilt wrapper */}
                <motion.div
                  animate={{
                    y: [-12, 0, -12],
                    boxShadow: isDark ? [
                      '0 40px 80px rgba(26,188,156,0.20), 0 0 20px rgba(26,188,156,0.20)',
                      '0 40px 80px rgba(26,188,156,0.30), 0 0 40px rgba(26,188,156,0.40)',
                      '0 40px 80px rgba(26,188,156,0.20), 0 0 20px rgba(26,188,156,0.20)',
                    ] : [
                      '0 40px 80px rgba(13,27,42,0.15), 0 0 20px rgba(26,188,156,0.25)',
                      '0 40px 80px rgba(13,27,42,0.20), 0 0 40px rgba(26,188,156,0.35)',
                      '0 40px 80px rgba(13,27,42,0.15), 0 0 20px rgba(26,188,156,0.25)',
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: '340px',
                    background: isDark ? 'rgba(17,34,64,0.85)' : '#0D2137',
                    border: `1px solid rgba(26,188,156,0.${isDark ? '3' : '4'})`,
                    borderRadius: '20px',
                    backdropFilter: 'blur(20px)',
                    padding: '20px',
                    transform: 'perspective(1000px) rotateY(-8deg)',
                  }}
                >
                  {/* ── Top bar ── */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#1ABC9C' }}>
                        <Scan className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>FoodGuard</span>
                      <span className="text-xs ml-1" style={{ color: '#A8B2C1' }}>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                  </div>

                  {/* ── Stats row: 3 mini cards ── */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Fresh', value: '62%', color: '#1ABC9C', bg: 'rgba(26,188,156,0.1)', dot: '#1ABC9C' },
                      { label: 'Expiring', value: '25%', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', dot: '#f59e0b' },
                      { label: 'Expired', value: '13%', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', dot: '#ef4444' },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className="rounded-xl p-2.5 flex flex-col gap-1"
                        style={{ background: stat.bg, border: `1px solid ${stat.color}22` }}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: stat.dot }} />
                          <span className="text-[10px]" style={{ color: '#A8B2C1', fontFamily: 'Inter, sans-serif' }}>{stat.label}</span>
                        </div>
                        <span className="font-bold text-sm" style={{ color: stat.color, fontFamily: 'Inter, sans-serif' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── Mini donut chart ── */}
                  <div className="flex items-center gap-4 mb-4 px-1">
                    <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
                      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Track */}
                        <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                        {/* Teal 62% fill */}
                        <circle
                          cx="40" cy="40" r="32" fill="none"
                          stroke="#1ABC9C" strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 32 * 0.62} ${2 * Math.PI * 32}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-bold text-sm" style={{ color: '#1ABC9C', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>62%</span>
                        <span className="text-[9px]" style={{ color: '#A8B2C1', fontFamily: 'Inter, sans-serif' }}>Fresh</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs font-semibold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>Inventory Health</div>
                      <div className="text-[11px]" style={{ color: '#A8B2C1' }}>19 items tracked</div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1ABC9C]" />
                        <span className="text-[10px]" style={{ color: '#A8B2C1' }}>AI monitoring active</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Divider ── */}
                  <div className="mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                  {/* ── Two mini recipe cards ── */}
                  <div className="flex flex-col gap-2">
                    {[
                      { emoji: '🍛', name: 'Chicken Biryani', kcal: '520 kcal', badge: 'AI Pick', badgeColor: '#1ABC9C', badgeBg: 'rgba(26,188,156,0.15)' },
                      { emoji: '🫘', name: 'Daal Tadka', kcal: '280 kcal', badge: 'Expiring', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)' },
                    ].map(card => (
                      <div
                        key={card.name}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <span className="text-xl flex-shrink-0">{card.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>{card.name}</div>
                          <div className="text-[10px]" style={{ color: '#A8B2C1' }}>{card.kcal}</div>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ color: card.badgeColor, background: card.badgeBg }}
                        >
                          {card.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ zIndex: 10 }}
        >
          <ChevronDown className="w-8 h-8" style={{ color: 'rgba(26,188,156,0.55)' }} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className="relative py-20"
        style={{ background: isDark ? 'transparent' : 'linear-gradient(135deg, #DFF2EC 0%, #EEF9F5 50%, #E4F0FF 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            See FoodGuard in Action
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2"
                  style={{
                    background: isDark ? 'rgba(17,34,64,0.50)' : '#0D2137',
                    backdropFilter: isDark ? 'blur(12px)' : 'none',
                    border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(26,188,156,0.2)',
                    boxShadow: isDark ? 'none' : '0 8px 32px rgba(13,27,42,0.12)',
                  }}
                  whileHover={{
                    borderColor: isDark ? 'rgba(26,188,156,0.5)' : 'rgba(26,188,156,0.7)',
                    boxShadow: isDark 
                      ? '0 0 40px rgba(26,188,156,0.2), 0 16px 40px rgba(0,0,0,0.3)'
                      : '0 0 30px rgba(26,188,156,0.35), 0 12px 40px rgba(13,27,42,0.2)',
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                      style={{ background: isDark ? 'rgba(26,188,156,0.1)' : 'rgba(26,188,156,0.15)' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: '#1ABC9C' }} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#FFFFFF' }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: '#A8B2C1' }}>
                      {feature.description}
                    </p>
                  </div>

                  {feature.items && (
                    <div className="space-y-2 mb-4">
                      {feature.items.map((item, i) => (
                        <div
                          key={i}
                          className={`text-sm px-3 py-2 rounded-lg ${
                            item.includes('Expiring')
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  {feature.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  )}

                  <button className="text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#1ABC9C' }}>
                    Learn More <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Track & Optimize Section */}
      <section id="how-it-works" className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>Track, </span>
            <span style={{ color: isDark ? '#1ABC9C' : '#0E9E82' }}>Manage, </span>
            <span style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>and </span>
            <span style={{ color: isDark ? '#1ABC9C' : '#0E9E82' }}>Optimize </span>
            <span style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>Your Food</span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Expiry Tracking Card */}
            <motion.div
              className="rounded-2xl p-8"
              style={{
                background: isDark ? 'rgba(17,34,64,0.50)' : '#0D2137',
                backdropFilter: isDark ? 'blur(12px)' : 'none',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(26,188,156,0.2)',
                boxShadow: isDark ? 'none' : '0 8px 32px rgba(13,27,42,0.12)',
              }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#FFFFFF' }}>
                Expiry Tracking & Alerts
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                  <div className="text-green-400 font-semibold mb-1">Fresh</div>
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-xs text-gray-400">items</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                  <div className="text-yellow-400 font-semibold mb-1">
                    Expiring Soon
                  </div>
                  <div className="text-2xl font-bold text-white">5</div>
                  <div className="text-xs text-gray-400">items</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                  <div className="text-red-400 font-semibold mb-1">Expired</div>
                  <div className="text-2xl font-bold text-white">2</div>
                  <div className="text-xs text-gray-400">items</div>
                </div>
              </div>
            </motion.div>

            {/* AI Meal Recommendations Card */}
            <motion.div
              className="rounded-2xl p-8"
              style={{
                background: isDark ? 'rgba(17,34,64,0.50)' : '#0D2137',
                backdropFilter: isDark ? 'blur(12px)' : 'none',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(26,188,156,0.2)',
                boxShadow: isDark ? 'none' : '0 8px 32px rgba(13,27,42,0.12)',
              }}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-6" style={{ color: '#FFFFFF' }}>
                AI-Powered Meal Recommendations
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#1e293b"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#1ABC9C"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56 * 0.63} ${
                        2 * Math.PI * 56
                      }`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">63%</div>
                      <div className="text-xs text-gray-400">Freshness</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center">
            <Button className="bg-[#1ABC9C] hover:bg-[#16a085] text-white rounded-full px-8 py-4">
              <Play className="w-5 h-5 mr-2" />
              Play Video
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section 
        className="relative py-20"
        style={{ background: isDark ? 'transparent' : 'linear-gradient(135deg, #E8F5F0 0%, #F5FDFB 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works: 3-Step Process
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div 
              className="hidden md:block absolute top-16 left-0 right-0 h-0.5 border-t-2 border-dashed" 
              style={{ borderColor: isDark ? 'rgba(26,188,156,0.30)' : 'rgba(14,158,130,0.4)' }}
            />

            {/* Step 1 */}
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div 
                className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: isDark ? 'linear-gradient(135deg, #1ABC9C, #3b82f6)' : '#0D2137',
                  border: isDark ? 'none' : '1px solid rgba(26,188,156,0.4)',
                  boxShadow: isDark ? '0 20px 40px rgba(26,188,156,0.5)' : '0 0 20px rgba(26,188,156,0.2)',
                }}
              >
                <Scan className="w-16 h-16" style={{ color: isDark ? '#FFFFFF' : '#1ABC9C' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>
                Step 1: Scan & Add
              </h3>
              <p style={{ color: isDark ? '#A8B2C1' : '#2D5A4E' }}>
                Quickly scan barcodes or receipts to add items
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div 
                className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: isDark ? 'linear-gradient(135deg, #1ABC9C, #3b82f6)' : '#0D2137',
                  border: isDark ? 'none' : '1px solid rgba(26,188,156,0.4)',
                  boxShadow: isDark ? '0 20px 40px rgba(26,188,156,0.5)' : '0 0 20px rgba(26,188,156,0.2)',
                }}
              >
                <div className="relative">
                  <Calendar className="w-12 h-12" style={{ color: isDark ? '#FFFFFF' : '#1ABC9C' }} />
                  <Bell className="w-8 h-8 absolute -top-2 -right-2" style={{ color: isDark ? '#FFFFFF' : '#1ABC9C' }} />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>
                Step 2: Track & Get Alerts
              </h3>
              <p style={{ color: isDark ? '#A8B2C1' : '#2D5A4E' }}>
                Receive timely notifications for expiring food
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div 
                className="relative z-10 w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  background: isDark ? 'linear-gradient(135deg, #1ABC9C, #3b82f6)' : '#0D2137',
                  border: isDark ? 'none' : '1px solid rgba(26,188,156,0.4)',
                  boxShadow: isDark ? '0 20px 40px rgba(26,188,156,0.5)' : '0 0 20px rgba(26,188,156,0.2)',
                }}
              >
                <div className="relative">
                  <Utensils className="w-12 h-12" style={{ color: isDark ? '#FFFFFF' : '#1ABC9C' }} />
                  <PiggyBank className="w-8 h-8 absolute -bottom-2 -right-2" style={{ color: isDark ? '#FFFFFF' : '#1ABC9C' }} />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3" style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}>
                Step 3: Cook & Save
              </h3>
              <p style={{ color: isDark ? '#A8B2C1' : '#2D5A4E' }}>
                Use ingredients before they expire and save money
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section 
        className="relative py-20"
        style={{ background: isDark ? 'transparent' : 'linear-gradient(135deg, #DFF2EC 0%, #EAF4FF 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ color: isDark ? '#FFFFFF' : '#0A2318' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Customer Testimonials
          </motion.h2>

           <Slider {...sliderSettings}>
             {testimonials.map((testimonial, index) => (
               <div key={index} className="px-4">
                 <div className="backdrop-blur-md rounded-2xl p-8 border-l-4 border-[#1ABC9C] border-r border-t border-b flex flex-col justify-between" style={{ background: c.cardBg, borderColor: c.border }}>
                   <div>
                     <div className="flex gap-1 mb-4">
                       {[...Array(testimonial.rating)].map((_, i) => (
                         <Star
                           key={i}
                           className="w-5 h-5 fill-[#1ABC9C] text-[#1ABC9C]"
                         />
                       ))}
                     </div>
                     <p className="text-sm italic mb-6" style={{ color: c.textSecondary }}>
                       "{testimonial.quote}"
                     </p>
                   </div>
                   <div>
                     <p className="font-semibold" style={{ color: c.textPrimary }}>
                       {testimonial.name}
                     </p>
                   </div>
                 </div>
               </div>
             ))}
           </Slider>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="relative py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-16"
            style={{ color: c.textPrimary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>

           <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="backdrop-blur-md rounded-xl px-6 py-3"
                style={{
                  background: c.cardBg,
                  border: `1px solid ${c.border}`,
                  boxShadow: c.cardShadow,
                }}
              >
                <AccordionTrigger className="text-left hover:text-[#1ABC9C]" style={{ color: c.textPrimary }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent style={{ color: c.textSecondary }}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-8"
            style={{ color: c.textPrimary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            className="text-xl text-center mb-16"
            style={{ color: c.textSecondary }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Choose the plan that's right for you
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <motion.div
              className="bg-[#112240]/50 backdrop-blur-md rounded-2xl p-8 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₨0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Up to 20 items</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Basic expiry alerts</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Limited AI recipes</span>
                </li>
              </ul>
              <Button onClick={() => onSelectPlan('free')} className="w-full bg-white/10 hover:bg-white/20 text-white">
                Get Started
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="bg-gradient-to-br from-[#1ABC9C] to-blue-500 rounded-2xl p-8 border-2 border-[#1ABC9C] relative transform scale-105"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                 Most Popular
               </div>
               <h3 className="text-2xl font-bold text-white mb-2" style={{ color: c.textPrimary }}>Pro</h3>
               <div className="mb-6">
                 <span className="text-5xl font-bold text-white" style={{ color: c.textPrimary }}>₨499</span>
                 <span className="text-sm" style={{ color: c.textSecondary }}> /month</span>
               </div>
               <ul className="space-y-3 mb-8">
                 <li className="flex items-start gap-2" style={{ color: c.textSecondary }}>
                   <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                   <span>Unlimited items</span>
                 </li>
                 <li className="flex items-start gap-2" style={{ color: c.textSecondary }}>
                   <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                   <span>Smart alerts & notifications</span>
                 </li>
                 <li className="flex items-start gap-2" style={{ color: c.textSecondary }}>
                   <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                   <span>Unlimited AI recipes</span>
                 </li>
                 <li className="flex items-start gap-2" style={{ color: c.textSecondary }}>
                   <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                   <span>Barcode & receipt scanning</span>
                 </li>
                 <li className="flex items-start gap-2" style={{ color: c.textSecondary }}>
                   <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                   <span>Nutrition tracking</span>
                 </li>
               </ul>
               <Button variant="white" className="w-full" onClick={() => onSelectPlan('pro')} disabled={busy === 'pro'} style={{ background: c.teal, color: '#fff' }}>
                 {busy === 'pro' ? 'Redirecting…' : 'Start Free Trial'}
               </Button>
             </motion.div>

            {/* Family Plan */}
            <motion.div
              className="bg-[#112240]/50 backdrop-blur-md rounded-2xl p-8 border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Family</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">₨899</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Up to 5 family members</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Shared inventory & shopping lists</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Family meal planning</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <ChevronRight className="w-5 h-5 text-[#1ABC9C] flex-shrink-0 mt-0.5" />
                  <span>Personalized nutrition per member</span>
                </li>
              </ul>
              <Button onClick={() => onSelectPlan('family')} disabled={busy === 'family'} className="w-full bg-white/10 hover:bg-white/20 text-white">
                {busy === 'family' ? 'Redirecting…' : 'Choose Family'}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            className="bg-gradient-to-br from-[#1ABC9C] to-blue-500 rounded-3xl p-12"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              See What You Get with FoodGuard Today
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of households and businesses reducing food waste
            </p>
            <Button variant="white" className="rounded-full px-12 py-6 text-lg font-semibold">
              Sign Up Now — It's Free!
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}