import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, Chrome } from 'lucide-react';
import { CosmicBackground } from '../components/layout/CosmicBackground';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

export function Signup() {
  const { c } = useTheme();
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();
  const { notify } = useNotifications();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError('');
    setSubmitting(true);
    const { ok, error } = await signup({ name: fullName, email, password });
    setSubmitting(false);
    if (!ok) {
      setFormError(error || 'Unable to create account.');
      notify(error || 'Signup failed', 'error');
      return;
    }
    notify('Account created successfully!', 'success');
    navigate('/dashboard', { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    const { ok, error } = await googleLogin();
    if (!ok) {
      setFormError(error || 'Google sign-in failed.');
      notify(error || 'Google sign-in failed', 'error');
      return;
    }
    notify('Signed in with Google!', 'success');
    navigate('/dashboard', { replace: true });
  };

  const inputBase = {
    background: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    color: c.inputText || '#FFFFFF',
  };
  const handleFocus = (e) => {
    e.currentTarget.style.border = `1px solid ${c.teal}`;
    e.currentTarget.style.boxShadow = `0 0 0 3px ${c.teal}26`;
  };
  const handleBlur = (e) => {
    e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-10"
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
        {/* Glassmorphism Card */}
        <div
          className="rounded-2xl p-8 sm:p-10"
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
            <div className="flex items-center gap-2 mb-6">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)' }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-2xl font-semibold"
                style={{ color: c.textOnCardPrimary || '#FFFFFF', fontFamily: 'Poppins, sans-serif' }}
              >
                FoodGuard
              </span>
            </div>
            <h1
              className="text-3xl font-bold text-center mb-2"
              style={{ color: c.textOnCardPrimary || '#FFFFFF', fontFamily: 'Poppins, sans-serif' }}
            >
              Create an Account
            </h1>
            <p className="text-sm text-center" style={{ color: c.textOnCardSecondary || '#A8B2C1' }}>
              Sign up to start managing your food
            </p>
          </div>

          {/* Google Sign-In Button */}
          <motion.button
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mb-4 flex items-center justify-center gap-2"
            style={{
              background: '#4285F4',
              boxShadow: '0 4px 24px rgba(66, 133, 244, 0.4)',
            }}
          >
            <Chrome className="w-5 h-5" />
            Sign up with Google
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: c.divider }} />
            <span className="text-sm" style={{ color: c.textOnCardSecondary || '#A8B2C1' }}>or</span>
            <div className="flex-1 h-px" style={{ background: c.divider }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textOnCardSecondary || '#A8B2C1' }} />
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl placeholder-gray-500 text-sm outline-none transition-all duration-200"
                style={inputBase}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textOnCardSecondary || '#A8B2C1' }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl placeholder-gray-500 text-sm outline-none transition-all duration-200"
                style={inputBase}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Create Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textOnCardSecondary || '#A8B2C1' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-12 py-3.5 rounded-xl placeholder-gray-500 text-sm outline-none transition-all duration-200"
                style={inputBase}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: c.textOnCardSecondary || '#A8B2C1' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                required
                className="w-full pl-11 pr-12 py-3.5 rounded-xl placeholder-gray-500 text-sm outline-none transition-all duration-200"
                style={{
                  ...inputBase,
                  ...(passwordError ? { border: '1px solid #ef4444' } : {}),
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: c.textOnCardSecondary || '#A8B2C1' }}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {passwordError && (
              <p className="text-red-400 text-xs -mt-1 pl-1">{passwordError}</p>
            )}

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
              <div className="relative mt-0.5 flex-shrink-0">
                <div
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                  className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all duration-200"
                  style={{
                    background: agreedToTerms ? '#1ABC9C' : 'rgba(255,255,255,0.05)',
                    border: agreedToTerms ? '1px solid #1ABC9C' : '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {agreedToTerms && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm leading-relaxed" style={{ color: c.textOnCardSecondary || '#A8B2C1' }}>
                I agree to the{' '}
                <Link
                  to="/terms-of-service"
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: '#1ABC9C' }}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy-policy"
                  className="hover:opacity-80 transition-opacity"
                  style={{ color: '#1ABC9C' }}
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Sign Up Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!agreedToTerms || submitting}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mt-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)',
                boxShadow: agreedToTerms ? '0 4px 24px rgba(26, 188, 156, 0.4)' : 'none',
              }}
            >
              {submitting ? 'Creating account…' : 'Sign Up'}
            </motion.button>
            {formError && (
              <p className="text-xs text-center" style={{ color: '#ef4444' }}>{formError}</p>
            )}
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm mt-6" style={{ color: c.textOnCardSecondary || '#A8B2C1' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium transition-colors hover:opacity-80"
              style={{ color: '#1ABC9C' }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}