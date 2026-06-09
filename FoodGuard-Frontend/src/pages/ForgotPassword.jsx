import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { CosmicBackground } from '../components/layout/CosmicBackground';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Button } from '../components/ui/Button';
import authService from '../services/auth.service';
import { useNotifications } from '../contexts/NotificationContext';

export function ForgotPassword() {
  const { c } = useTheme();
  const { notify } = useNotifications();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
      notify('Reset link sent — check your inbox.', 'success');
    } catch (err) {
      // Don't reveal account existence — still show success-style UI
      setSubmitted(true);
      notify('If an account exists, a reset link was sent.', 'info');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4"
      style={{ background: c.pageBg }}
    >
      <CosmicBackground />

      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div
          className="rounded-2xl p-7 sm:p-10"
          style={{
            background: c.cardBgAlpha,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${c.border}`,
            boxShadow: c.cardShadow,
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)',
                }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-xl font-bold"
                style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
              >
                FoodGuard
              </span>
            </div>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
                style={{ background: 'rgba(26,188,156,0.15)' }}
              >
                <CheckCircle2
                  className="w-8 h-8"
                  style={{ color: '#1ABC9C' }}
                />
              </div>
              <h1
                className="text-xl sm:text-2xl font-bold mb-2"
                style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
              >
                Check your email
              </h1>
              <p
                className="text-sm mb-6"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                We sent a password reset link to{' '}
                <span style={{ color: '#1ABC9C' }}>{email}</span>. The link
                expires in 30 minutes.
              </p>
              <p
                className="text-xs mb-6"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                Didn't get it? Check your spam folder, or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="underline font-medium"
                  style={{ color: '#1ABC9C' }}
                >
                  try a different email
                </button>
                .
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              <h1
                className="text-xl sm:text-2xl font-bold mb-2 text-center"
                style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
              >
                Forgot your password?
              </h1>
              <p
                className="text-sm mb-7 text-center"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                No worries — enter your email and we'll send you a link to
                reset it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${c.inputBorder}`,
                        color: c.inputText || '#FFFFFF',
                      }}
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Send Reset Link
                </Button>
              </form>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm mt-6 hover:underline"
                style={{ color: '#1ABC9C' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </>
          )}
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: c.textSecondary }}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold hover:underline"
            style={{ color: c.teal }}
          >
            Sign up free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
