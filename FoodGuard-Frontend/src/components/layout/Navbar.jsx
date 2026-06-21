import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Menu,
  X,
  Bell,
  User,
  Settings,
  LifeBuoy,
  LogOut,
  CreditCard,
  ChevronDown,
  LogIn,
  UserPlus,
  Scale,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../../contexts/AuthContext';

const PUBLIC_LINKS = [
  { label: 'Home', path: '/' },
];

const AUTH_LINKS = [
  { label: 'Home',               path: '/'              },
  { label: 'Expiry Alerts',      path: '/expiry-alerts' },
  { label: 'Inventory',          path: '/inventory'     },
  { label: 'AI Meals',           path: '/ai-meals'      },
  { label: 'Nutrition Insights', path: '/nutrition'     },
  { label: 'Dashboard',          path: '/dashboard'     },
];

const USER_MENU = [
  { label: 'Profile & Settings', path: '/settings',      Icon: Settings    },
  { label: 'BMI Calculator',     path: '/bmi',           Icon: Scale       },
  { label: 'Notifications',      path: '/notifications', Icon: Bell        },
  { label: 'Pricing',            path: '/pricing',       Icon: CreditCard  },
  { label: 'Help Center',        path: '/help-center',   Icon: LifeBuoy    },
];

function getInitials(user) {
  if (!user) return '';
  const source = (user.name || user.fullName || user.username || user.email || '').trim();
  if (!source) return '';
  if (source.includes('@')) return source[0].toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getDisplayName(user) {
  if (!user) return '';
  return user.name || user.fullName || user.username || (user.email ? user.email.split('@')[0] : '');
}

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();
  const { c } = useTheme();

  const navText       = c.navText || '#FFFFFF';
  const navTextStrong = c.textPrimary || c.logoBrandColor || '#FFFFFF';

  const NAV_LINKS = isAuthenticated ? AUTH_LINKS : PUBLIC_LINKS;
  const initials  = useMemo(() => getInitials(user), [user]);
  const displayName = useMemo(() => getDisplayName(user), [user]);
  const planLabel = user?.plan || 'Free Plan';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    if (userOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [userOpen]);

  const handleLogout = async () => {
    setUserOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background:    scrolled ? c.navBgScrolled : c.navBg,
          backdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(12px)',
          borderBottom:  scrolled ? `1px solid ${c.navBorder}` : `1px solid ${c.navBorderOff}`,
          boxShadow:     scrolled ? c.navShadow : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* ── LEFT: Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-2.5 flex-shrink-0 group"
              aria-label="FoodGuard Home"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #1ABC9C, #0e9c80)' }}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-[17px] font-semibold tracking-tight"
                style={{ color: c.logoBrandColor, fontFamily: 'Poppins, Inter, sans-serif' }}
              >
                FoodGuard
              </span>
            </Link>

            {/* ── CENTER: Desktop Nav Links ── */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="relative px-3 py-2 rounded-lg text-[15px] whitespace-nowrap"
                    style={{
                      color:      active ? c.teal : c.textSecondary,
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: active ? 600 : 400,
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget).style.color = c.teal;
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget).style.color = c.textSecondary;
                    }}
                  >
                    {link.label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                        style={{ background: c.teal }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── RIGHT: Toggle + Auth + Hamburger ── */}
            <div className="flex items-center gap-3">

              {/* Theme Toggle — desktop */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {isAuthenticated ? (
                <>
                  {/* Notifications icon — desktop */}
                  <Link
                    to="/notifications"
                    className="hidden md:flex relative items-center justify-center w-9 h-9 rounded-lg transition-colors"
                    style={{ color: navText }}
                    onMouseEnter={e => { e.currentTarget.style.color = c.teal; e.currentTarget.style.background = `${c.teal}14`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = navText; e.currentTarget.style.background = 'transparent'; }}
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ background: c.teal }}
                    />
                  </Link>

                  {/* User dropdown — desktop */}
                  <div className="hidden md:block relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserOpen((p) => !p)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                      style={{ color: navText }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${c.teal}14`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      aria-label="Account menu"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})` }}
                      >
                        {initials || <User className="w-4 h-4" />}
                      </div>
                      <ChevronDown
                        className="w-3.5 h-3.5 transition-transform"
                        style={{ transform: userOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                      />
                    </button>

                    <AnimatePresence>
                      {userOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 rounded-xl overflow-hidden z-50"
                          style={{
                            background: c.cardBg,
                            border: `1px solid ${c.border}`,
                            boxShadow: c.cardShadow,
                          }}
                        >
                          {/* User info */}
                          <div
                            className="px-4 py-3 flex items-center gap-3"
                            style={{ borderBottom: `1px solid ${c.divider}` }}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})` }}
                            >
                              {initials || <User className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: c.textOnCardPrimary || c.textPrimary }}>
                                {displayName}
                              </div>
                              <div className="text-xs truncate" style={{ color: c.textOnCardSecondary || c.textSecondary }}>
                                {planLabel}
                              </div>
                            </div>
                          </div>

                          <div className="py-1">
                            {USER_MENU.map((item) => {
                              const Icon = item.Icon;
                              return (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                  style={{ color: c.textOnCardSecondary || c.textSecondary }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = c.tagBg;
                                    e.currentTarget.style.color = c.teal;
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = c.textOnCardSecondary || c.textSecondary;
                                  }}
                                >
                                  <Icon className="w-4 h-4" />
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>

                          <div style={{ borderTop: `1px solid ${c.divider}` }} className="py-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                              style={{ color: '#ef4444' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                            >
                              <LogOut className="w-4 h-4" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                /* ── Logged-out: Sign in / Sign up — desktop ── */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] font-medium transition-colors"
                    style={{ color: navText, background: 'transparent', border: `1px solid ${c.navBorder}` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${c.teal}14`; e.currentTarget.style.color = c.teal; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = navText; }}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[14px] font-semibold transition-transform"
                    style={{
                      color: '#FFFFFF',
                      background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign up
                  </Link>
                </div>
              )}

              {/* Hamburger — mobile */}
              <button
                onClick={() => setMobileOpen(prev => !prev)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ color: c.teal, background: `${c.teal}14` }}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE DROPDOWN ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
              style={{ background: c.mobileMenuBg, borderTop: `1px solid ${c.mobileMenuBorder}` }}
            >
              <div className="px-4 py-2 pb-4">
                {NAV_LINKS.map((link, i) => {
                  const active = isActive(link.path);
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i }}
                    >
                      <Link
                        to={link.path}
                        className="flex items-center text-[16px]"
                        style={{
                          color:       active ? c.teal : c.textSecondary,
                          fontWeight:  active ? 600 : 400,
                          fontFamily:  'Inter, sans-serif',
                          padding:     '14px 20px',
                          borderLeft:  active ? `2px solid ${c.teal}` : '2px solid transparent',
                          borderRadius: '0 8px 8px 0',
                          marginLeft:  '-1px',
                        }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Divider */}
                <div className="my-3 mx-5" style={{ height: '1px', background: c.divider }} />

                {/* Mobile Theme Toggle */}
                <div className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm" style={{ color: navText, fontFamily: 'Inter, sans-serif' }}>
                    Theme
                  </span>
                  <ThemeToggle />
                </div>

                {isAuthenticated ? (
                  <>
                    {/* Mobile User Section */}
                    <div
                      className="px-5 py-3 flex items-center gap-3"
                      style={{
                        background: c.cardBgAlpha,
                        borderRadius: '12px',
                        margin: '0 4px',
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})` }}
                      >
                        {initials || <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate" style={{ color: navTextStrong }}>
                          {displayName}
                        </div>
                        <div className="text-xs truncate" style={{ color: navText }}>
                          {planLabel}
                        </div>
                      </div>
                    </div>

                    {/* Mobile User Menu Items */}
                    <div className="mt-2">
                      {USER_MENU.map((item) => {
                        const Icon = item.Icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center gap-3 text-[15px]"
                            style={{
                              color:      c.textSecondary,
                              fontFamily: 'Inter, sans-serif',
                              padding:    '12px 20px',
                            }}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Mobile Logout */}
                    <div className="flex flex-col gap-2 px-4 mt-3">
                      <button
                        onClick={handleLogout}
                        className="w-full py-3 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
                        style={{
                          color:      '#ef4444',
                          background: 'rgba(239,68,68,0.1)',
                          border:     '1px solid rgba(239,68,68,0.3)',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  /* Mobile Sign in / Sign up */
                  <div className="flex flex-col gap-2 px-4 mt-3">
                    <button
                      onClick={() => { navigate('/login'); setMobileOpen(false); }}
                      className="w-full py-3 rounded-xl text-[15px] font-medium flex items-center justify-center gap-2"
                      style={{
                        color:      navText,
                        background: c.cardBgAlpha,
                        border:     `1px solid ${c.borderLight}`,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <LogIn className="w-4 h-4" />
                      Sign in
                    </button>
                    <button
                      onClick={() => { navigate('/signup'); setMobileOpen(false); }}
                      className="w-full py-3 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2"
                      style={{
                        color:      '#FFFFFF',
                        background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign up
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
