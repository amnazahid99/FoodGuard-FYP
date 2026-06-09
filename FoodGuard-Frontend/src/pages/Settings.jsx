import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Bell,
  Leaf,
  Globe,
  Trash2,
  Save,
  Camera,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import settingsService from '../services/settings.service';
import billingService from '../services/billing.service';

const TABS = [
  { id: 'profile',     label: 'Profile',       Icon: User },
  { id: 'account',     label: 'Account',       Icon: Lock },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'preferences', label: 'Preferences',   Icon: Leaf },
];

export function Settings() {
  const { c, isDark } = useTheme();
  const { user, logout, refreshProfile } = useAuth();
  const { notify } = useNotifications();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billingNote, setBillingNote] = useState(null);

  const planNames = { free: 'Free Plan', pro: 'Pro Plan', family: 'Family Plan' };
  const planLabel = planNames[user?.plan] || 'Free Plan';
  const memberSince = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  const planEnd = user?.subscription?.currentPeriodEnd;
  const expiryLabel = planEnd ? new Date(planEnd).toLocaleDateString() : null;

  // After Stripe redirects back, confirm the payment (activates the plan) then refresh.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('billing') !== 'success') return;
    const sessionId = p.get('session_id');
    (async () => {
      try { if (sessionId) await billingService.confirmCheckout(sessionId); }
      catch (e) { setBillingNote(e.message || 'Could not confirm payment.'); }
      await refreshProfile?.();
      setBillingNote((n) => n || 'Payment successful — your plan is now active.');
    })();
    window.history.replaceState({}, '', '/settings');
  }, []); // eslint-disable-line

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const [notifs, setNotifs] = useState({
    emailExpiry: true,
    emailWeekly: true,
    emailMarketing: false,
    pushExpiry: true,
    pushRecipes: false,
    pushTips: true,
  });

  const [prefs, setPrefs] = useState({
    diet: 'omnivore',
    cuisine: 'pakistani',
    units: 'metric',
    language: 'english',
    expiryWarning: 3,
  });

  // Hydrate from backend (profile + preferences)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await settingsService.getProfile();
        if (active && p) setProfile((prev) => ({ ...prev, ...p }));
      } catch (_) { /* keep current */ }
      try {
        const pref = await settingsService.getPreferences();
        if (active && pref) {
          setPrefs((prev) => ({ ...prev, ...pref }));
          if (pref.notifications) setNotifs((prev) => ({ ...prev, ...pref.notifications }));
        }
      } catch (_) { /* keep defaults */ }
    })();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'profile') {
        await settingsService.updateProfile(profile);
        notify('Profile saved', 'success');
      } else if (activeTab === 'account') {
        if (!password.current || !password.next) {
          notify('Please fill in your current and new password', 'error');
          setSaving(false); return;
        }
        if (password.next !== password.confirm) {
          notify('New passwords do not match', 'error');
          setSaving(false); return;
        }
        await settingsService.updatePassword({
          currentPassword: password.current,
          newPassword: password.next,
        });
        setPassword({ current: '', next: '', confirm: '' });
        notify('Password updated', 'success');
      } else if (activeTab === 'notifications') {
        await settingsService.updateNotifications(notifs);
        notify('Notification preferences saved', 'success');
      } else if (activeTab === 'preferences') {
        await settingsService.updatePreferences(prefs);
        notify('Preferences saved', 'success');
      }
      // Refresh the in-memory user so personalised features (AI meals, etc.)
      // immediately reflect the new profile/preferences without a reload.
      await refreshProfile?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      notify(err.message || 'Could not save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await settingsService.deleteAccount();
      notify('Account deleted', 'success');
      await logout();
    } catch (err) {
      notify(err.message || 'Could not delete account', 'error');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const cardBase = {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.cardShadow,
  };
  const onCardPrimary = isDark ? c.textPrimary : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all';
  const inputStyle = {
    background: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    color: c.inputText || c.textPrimary,
  };

  const Toggle = ({ checked, onChange, label, sub }) => (
    <div
      className="flex items-center justify-between p-4 rounded-xl gap-4"
      style={{
        background: c.inlineCardBg,
        border: `1px solid ${c.inlineCardBorder}`,
      }}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium" style={{ color: onCardPrimary }}>
          {label}
        </div>
        {sub && (
          <div className="text-xs mt-0.5" style={{ color: onCardSecondary }}>
            {sub}
          </div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
        style={{ background: checked ? c.teal : c.borderMid }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: c.pageBg }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1
            className="text-3xl sm:text-4xl font-bold mb-2"
            style={{ color: c.textPrimary }}
          >
            Settings
          </h1>
          <p className="text-sm sm:text-base" style={{ color: c.textSecondary }}>
            Manage your account, preferences, and notification settings.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* ─── Sidebar ─── */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="rounded-2xl p-3" style={cardBase}>
              <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                {TABS.map((tab) => {
                  const Icon = tab.Icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-left"
                      style={{
                        background: active ? c.tagBg : 'transparent',
                        color: active ? c.teal : onCardSecondary,
                      }}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.aside>

          {/* ─── Content ─── */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* ── PROFILE ── */}
            {activeTab === 'profile' && (
              <>
                <div className="rounded-2xl p-6 sm:p-8" style={cardBase}>
                  <h2
                    className="text-lg sm:text-xl font-semibold mb-6"
                    style={{ color: onCardPrimary }}
                  >
                    Profile Information
                  </h2>

                  {/* Avatar */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
                    <div className="relative">
                      <div
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${c.teal}, ${c.tealHover})`,
                        }}
                      >
                        {profile.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <button
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-white"
                        style={{ background: c.teal }}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3
                        className="text-base sm:text-lg font-semibold"
                        style={{ color: onCardPrimary }}
                      >
                        {profile.name}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: onCardSecondary }}
                      >
                        {profile.email}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: c.teal }}
                      >
                        {planLabel} · Member since {memberSince}
                      </p>
                      {user?.plan && user.plan !== 'free' ? (
                        <p className="text-xs mt-1" style={{ color: onCardSecondary }}>
                          {expiryLabel ? `Active until ${expiryLabel}` : 'Active'}{' · '}
                          <Link to="/pricing" className="font-semibold underline" style={{ color: c.teal }}>
                            Renew / change
                          </Link>
                        </p>
                      ) : (
                        <Link
                          to="/pricing"
                          className="text-xs mt-1 font-semibold underline inline-block"
                          style={{ color: c.teal }}
                        >
                          Upgrade plan
                        </Link>
                      )}
                      {billingNote && (
                        <p className="text-xs mt-1" style={{ color: c.teal }}>{billingNote}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: onCardPrimary }}
                      >
                        Full Name
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={profile.name}
                        onChange={(e) =>
                          setProfile({ ...profile, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: onCardPrimary }}
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        className={inputClass}
                        style={inputStyle}
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: onCardPrimary }}
                      >
                        Phone
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        className="block text-xs font-medium mb-2"
                        style={{ color: onCardPrimary }}
                      >
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        className={`${inputClass} resize-none`}
                        style={inputStyle}
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                    {saved && (
                      <div
                        className="flex items-center gap-2 text-sm"
                        style={{ color: c.teal }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Saved successfully
                      </div>
                    )}
                    <Button onClick={handleSave} className="ml-auto w-full sm:w-auto">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* ── ACCOUNT ── */}
            {activeTab === 'account' && (
              <>
                <div className="rounded-2xl p-6 sm:p-8" style={cardBase}>
                  <h2
                    className="text-lg sm:text-xl font-semibold mb-6"
                    style={{ color: onCardPrimary }}
                  >
                    Change Password
                  </h2>
                  <div className="space-y-4">
                    {[
                      { key: 'current', label: 'Current Password' },
                      { key: 'next',    label: 'New Password' },
                      { key: 'confirm', label: 'Confirm New Password' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: onCardPrimary }}
                        >
                          {f.label}
                        </label>
                        <input
                          type="password"
                          className={inputClass}
                          style={inputStyle}
                          value={password[f.key]}
                          onChange={(e) =>
                            setPassword({ ...password, [f.key]: e.target.value })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button onClick={handleSave} className="w-full sm:w-auto">
                      Update Password
                    </Button>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6 sm:p-8"
                  style={{
                    ...cardBase,
                    border: '1px solid rgba(239,68,68,0.3)',
                  }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.12)' }}
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3
                        className="text-base sm:text-lg font-semibold mb-1"
                        style={{ color: onCardPrimary }}
                      >
                        Danger Zone
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: onCardSecondary }}
                      >
                        Once you delete your account, there's no going back.
                        All your data will be permanently removed.
                      </p>
                    </div>
                  </div>
                  {showDeleteConfirm ? (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
                        style={{
                          background: 'transparent',
                          color: onCardPrimary,
                          border: `1px solid ${c.borderMid}`,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          handleDeleteAccount();
                        }}
                        className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600"
                      >
                        Yes, Delete My Account
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-500 mt-4"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── NOTIFICATIONS ── */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl p-6 sm:p-8" style={cardBase}>
                <h2
                  className="text-lg sm:text-xl font-semibold mb-2"
                  style={{ color: onCardPrimary }}
                >
                  Notification Preferences
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: onCardSecondary }}
                >
                  Choose how and when you want to hear from us.
                </p>

                <div className="space-y-5">
                  <div>
                    <h3
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: onCardPrimary }}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </h3>
                    <div className="space-y-3">
                      <Toggle
                        checked={notifs.emailExpiry}
                        onChange={() =>
                          setNotifs({ ...notifs, emailExpiry: !notifs.emailExpiry })
                        }
                        label="Expiry Alerts"
                        sub="Get an email when items are about to expire"
                      />
                      <Toggle
                        checked={notifs.emailWeekly}
                        onChange={() =>
                          setNotifs({ ...notifs, emailWeekly: !notifs.emailWeekly })
                        }
                        label="Weekly Summary"
                        sub="A digest of your inventory and savings every Sunday"
                      />
                      <Toggle
                        checked={notifs.emailMarketing}
                        onChange={() =>
                          setNotifs({
                            ...notifs,
                            emailMarketing: !notifs.emailMarketing,
                          })
                        }
                        label="Product Updates & Tips"
                        sub="Occasional announcements and recipe tips"
                      />
                    </div>
                  </div>

                  <div>
                    <h3
                      className="text-sm font-semibold mb-3 flex items-center gap-2"
                      style={{ color: onCardPrimary }}
                    >
                      <Bell className="w-4 h-4" /> Push Notifications
                    </h3>
                    <div className="space-y-3">
                      <Toggle
                        checked={notifs.pushExpiry}
                        onChange={() =>
                          setNotifs({ ...notifs, pushExpiry: !notifs.pushExpiry })
                        }
                        label="Expiry Reminders"
                        sub="Push alerts on your device"
                      />
                      <Toggle
                        checked={notifs.pushRecipes}
                        onChange={() =>
                          setNotifs({
                            ...notifs,
                            pushRecipes: !notifs.pushRecipes,
                          })
                        }
                        label="Recipe Suggestions"
                        sub="When the AI finds a great match for your inventory"
                      />
                      <Toggle
                        checked={notifs.pushTips}
                        onChange={() =>
                          setNotifs({ ...notifs, pushTips: !notifs.pushTips })
                        }
                        label="Daily Tips"
                        sub="One short kitchen tip per day"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} className="w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === 'preferences' && (
              <div className="rounded-2xl p-6 sm:p-8" style={cardBase}>
                <h2
                  className="text-lg sm:text-xl font-semibold mb-2"
                  style={{ color: onCardPrimary }}
                >
                  App Preferences
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: onCardSecondary }}
                >
                  Personalize how FoodGuard works for you.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: onCardPrimary }}
                    >
                      Dietary Preference
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={prefs.diet}
                      onChange={(e) =>
                        setPrefs({ ...prefs, diet: e.target.value })
                      }
                    >
                      <option value="omnivore">Omnivore</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="pescatarian">Pescatarian</option>
                      <option value="keto">Keto</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: onCardPrimary }}
                    >
                      Favorite Cuisine
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={prefs.cuisine}
                      onChange={(e) =>
                        setPrefs({ ...prefs, cuisine: e.target.value })
                      }
                    >
                      <option value="pakistani">Pakistani</option>
                      <option value="indian">Indian</option>
                      <option value="middle-eastern">Middle Eastern</option>
                      <option value="mediterranean">Mediterranean</option>
                      <option value="asian">Asian</option>
                      <option value="western">Western</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: onCardPrimary }}
                    >
                      Units
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={prefs.units}
                      onChange={(e) =>
                        setPrefs({ ...prefs, units: e.target.value })
                      }
                    >
                      <option value="metric">Metric (kg, ml)</option>
                      <option value="imperial">Imperial (lb, oz)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: onCardPrimary }}
                    >
                      Language
                    </label>
                    <select
                      className={inputClass}
                      style={inputStyle}
                      value={prefs.language}
                      onChange={(e) =>
                        setPrefs({ ...prefs, language: e.target.value })
                      }
                    >
                      <option value="english">English</option>
                      <option value="urdu">Urdu</option>
                      <option value="arabic">Arabic</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label
                      className="block text-xs font-medium mb-2"
                      style={{ color: onCardPrimary }}
                    >
                      Expiry Warning ({prefs.expiryWarning} days before)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="14"
                      value={prefs.expiryWarning}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          expiryWarning: Number(e.target.value),
                        })
                      }
                      className="w-full accent-teal-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={handleSave} className="w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" /> Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
