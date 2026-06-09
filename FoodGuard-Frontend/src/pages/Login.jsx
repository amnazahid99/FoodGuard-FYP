import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from 'lucide-react';
import { CosmicBackground } from '../components/layout/CosmicBackground';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { notify } = useNotifications();
  const { c } = useTheme();
  // Card stays DARK in both themes — keep in-card text light always
  const onCardPrimary   = c.textOnCardPrimary   || '#FFFFFF';
  const onCardSecondary = c.textOnCardSecondary || '#A8B2C1';
  const onCardMuted     = c.textOnCardMuted     || '#6B8A9E';
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    const { ok, error } = await login({ email, password, remember: rememberMe });
    setSubmitting(false);
    if (!ok) {
      setFormError(error || 'Invalid credentials.');
      notify(error || 'Login failed', 'error');
      return;
    }
    notify('Welcome back!', 'success');
    const from = location.state?.from || '/dashboard';
    navigate(from, { replace: true });
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4"
      style={{ background: c.pageBg }}
    >
      <CosmicBackground />

      {/* Theme toggle — top-right */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px]"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8 sm:p-10"
          style={{
            background:         c.cardBgAlpha,
            backdropFilter:     'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:             `1px solid ${c.border}`,
            boxShadow:          c.cardShadow,
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)' }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-2xl font-semibold"
                style={{ color: onCardPrimary, fontFamily: 'Poppins, sans-serif' }}
              >
                FoodGuard
              </span>
            </div>
            <h1
              className="text-3xl font-bold text-center mb-2"
              style={{ color: onCardPrimary, fontFamily: 'Poppins, sans-serif' }}
            >
              Welcome Back!
            </h1>
            <p className="text-sm text-center" style={{ color: onCardSecondary }}>Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: onCardMuted }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm outline-none"
                style={{
                  background:  c.inputBg,
                  border:      `1px solid ${c.inputBorder}`,
                  color:       c.textPrimary,
                  fontFamily:  'Inter, sans-serif',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.teal}`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${c.teal}26`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: onCardMuted }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm outline-none"
                style={{
                  background:  c.inputBg,
                  border:      `1px solid ${c.inputBorder}`,
                  color:       c.textPrimary,
                  fontFamily:  'Inter, sans-serif',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.teal}`;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${c.teal}26`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: onCardMuted }}
                onMouseEnter={e => { (e.currentTarget).style.color = c.textSecondary; }}
                onMouseLeave={e => { (e.currentTarget).style.color = c.textMuted; }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="sr-only" />
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 rounded flex items-center justify-center cursor-pointer"
                    style={{
                      background: rememberMe ? c.teal : c.inputBg,
                      border: `1px solid ${rememberMe ? c.teal : c.inputBorder}`,
                    }}
                  >
                    {rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm" style={{ color: onCardSecondary }}>Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm hover:opacity-80" style={{ color: c.teal }}>
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mt-2"
              style={{
                background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                boxShadow:  '0 4px 24px rgba(26,188,156,0.4)',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </motion.button>
            {formError && (
              <p className="text-xs text-center" style={{ color: '#ef4444' }}>{formError}</p>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: c.divider }} />
            <span className="text-sm" style={{ color: onCardMuted }}>or</span>
            <div className="flex-1 h-px" style={{ background: c.divider }} />
          </div>

          

          <p className="text-center text-sm mt-6" style={{ color: onCardSecondary }}>
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium hover:opacity-80" style={{ color: c.teal }}>
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}