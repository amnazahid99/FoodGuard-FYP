import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CosmicBackground } from '../components/layout/CosmicBackground';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Button } from '../components/ui/Button';
import authService from '../services/auth.service';

export function ResetPassword() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password strength
  const strength = (() => {
    if (pwd.length === 0) return { score: 0, label: '', color: '#A8B2C1' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = {
      1: { label: 'Weak',     color: '#ef4444' },
      2: { label: 'Fair',     color: '#f59e0b' },
      3: { label: 'Good',     color: '#3b82f6' },
      4: { label: 'Strong',   color: '#22c55e' },
    };
    return { score, ...(map[score] || map[1]) };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8) return setError('Password must be at least 8 characters.');
    if (pwd !== confirm) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      await authService.resetPassword({ token: resetToken, password: pwd });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message || 'Could not reset password. The link may have expired.');
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

          {success ? (
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
                Password reset!
              </h1>
              <p
                className="text-sm"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                Redirecting you to the login page…
              </p>
            </motion.div>
          ) : (
            <>
              <h1
                className="text-xl sm:text-2xl font-bold mb-2 text-center"
                style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
              >
                Create a new password
              </h1>
              <p
                className="text-sm mb-7 text-center"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                Pick something strong you'll remember.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
                    />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      required
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${c.inputBorder}`,
                        color: c.inputText || '#FFFFFF',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
                    >
                      {showPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {pwd.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              background:
                                i <= strength.score
                                  ? strength.color
                                  : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        ))}
                      </div>
                      <p
                        className="text-xs"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className="block text-xs font-medium mb-2"
                    style={{ color: c.textOnCardPrimary || '#FFFFFF' }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
                    />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
                      style={{
                        background: c.inputBg,
                        border: `1px solid ${c.inputBorder}`,
                        color: c.inputText || '#FFFFFF',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2 p-3 rounded-lg text-xs"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full">
                  Reset Password
                </Button>
              </form>

              <Link
                to="/login"
                className="block text-center text-sm mt-6 hover:underline"
                style={{ color: '#1ABC9C' }}
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
