import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ScanLine,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useInventory } from '../contexts/InventoryContext';
import { useNotifications } from '../contexts/NotificationContext';
import inventoryService from '../services/inventory.service';

const categories = [
  'Grains', 'Legumes', 'Meat', 'Dairy', 'Vegetables',
  'Poultry', 'Bakery', 'Oils', 'Fruits', 'Snacks', 'Beverages', 'Other',
];

const statusConfig = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: AlertTriangle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  good:     { color: '#1ABC9C', bg: 'rgba(26,188,156,0.12)', icon: CheckCircle },
};

function computeStatus(expiry) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiry);
  const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return 'critical';
  if (diffDays <= 7) return 'warning';
  return 'good';
}

const emptyForm = { name: '', category: 'Grains', qty: 1, expiry: '' };

export function Inventory() {
  const { c, isDark } = useTheme();
  const { items: rawItems, addItem, loading, refresh } = useInventory();
  const { notify } = useNotifications();
  const onCardPrimary   = isDark ? c.textPrimary   : c.textOnCardPrimary;
  const onCardSecondary = isDark ? c.textSecondary : c.textOnCardSecondary;
  const onCardMuted     = isDark ? c.textMuted     : (c.textOnCardMuted || c.textOnCardSecondary);

  // Derive status from expiry every render so dates stay live.
  const items = useMemo(
    () => (rawItems || []).map((it) => ({ ...it, status: computeStatus(it.expiry) })),
    [rawItems],
  );
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // FEATURE 1 — receipt scanning
  const fileRef = useRef(null);
  const [showScan, setShowScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed] = useState([]);
  const [scanError, setScanError] = useState('');
  const [savingScan, setSavingScan] = useState(false);

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()),
  );

  const chartData = useMemo(() => {
    const counts = { good: 0, warning: 0, critical: 0 };
    items.forEach((i) => {
      counts[i.status] += 1;
    });
    return [
      { name: 'Good',     value: counts.good,     color: '#1ABC9C' },
      { name: 'Warning',  value: counts.warning,  color: '#f59e0b' },
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
    ];
  }, [items]);

  // Lock background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (showModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  const openModal = () => {
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'qty' ? Math.max(1, Number(value) || 1) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Please enter an item name.');
    if (!form.expiry) return setError('Please select an expiry date.');

    const payload = {
      name: form.name.trim(),
      category: form.category,
      qty: Number(form.qty) || 1,
      expiry: form.expiry,
    };
    setSubmitting(true);
    const res = await addItem(payload);
    setSubmitting(false);
    if (res?.ok) {
      notify('Item added to inventory', 'success');
      closeModal();
    } else {
      setError(res?.error || 'Could not add item. Please try again.');
    }
  };

  const handleReceiptPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanning(true); setScanError(''); setParsed([]); setShowScan(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const result = await inventoryService.scanReceipt(fd);
      setParsed((result || []).map((it) => ({
        ...it, include: true, expiry: (it.expiry || '').slice(0, 10),
      })));
      if (!result || !result.length) setScanError('No items detected. Try a clearer photo.');
    } catch (err) {
      setScanError(err.message || 'Could not scan receipt.');
    } finally {
      setScanning(false);
    }
  };

  const toggleParsed = (idx) =>
    setParsed((p) => p.map((it, i) => (i === idx ? { ...it, include: !it.include } : it)));
  const editParsed = (idx, field, value) =>
    setParsed((p) => p.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const handleSaveScanned = async () => {
    const toSave = parsed.filter((it) => it.include && it.name && it.expiry);
    if (!toSave.length) { setScanError('Select at least one item with a name and expiry date.'); return; }
    setSavingScan(true); setScanError('');
    try {
      await inventoryService.bulkAdd(toSave.map((it) => ({
        name: it.name,
        category: it.category || 'Other',
        quantity: Number(it.quantity) || 1,
        qty: String(it.quantity || 1),
        unit: it.unit || 'pcs',
        expiry: it.expiry,
      })));
      await refresh?.();
      notify(`${toSave.length} item(s) added from receipt`, 'success');
      setShowScan(false); setParsed([]);
    } catch (err) {
      setScanError(err.message || 'Could not save items.');
    } finally {
      setSavingScan(false);
    }
  };

  const cardStyle = {
    background: c.cardBg,
    border: `1px solid ${c.border}`,
    boxShadow: c.cardShadow,
  };

  const inputStyle = {
    background: c.inputBg,
    border: `1px solid ${c.inputBorder}`,
    color: c.inputText || '#FFFFFF',
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.tagBg }}
              >
                <Package className="w-5 h-5" style={{ color: c.teal }} />
              </div>
              <h1
                className="text-3xl font-bold"
                style={{ color: c.textPrimary, fontFamily: 'Poppins, sans-serif' }}
              >
                Inventory
              </h1>
            </div>
            <p style={{ color: c.textSecondary }} className="text-sm">
              Manage your food stock, track quantities and statuses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptPick} />
            <motion.button
              onClick={() => fileRef.current?.click()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: c.tagBg, color: c.teal, border: `1px solid ${c.border}` }}
            >
              <ScanLine className="w-4 h-4" /> Scan Receipt
            </motion.button>
            <motion.button
              onClick={openModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg,#1ABC9C,#0e9c80)',
                boxShadow: '0 4px 20px rgba(26,188,156,0.35)',
              }}
            >
              <Plus className="w-4 h-4" /> Add Food Item
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="relative mb-4">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: onCardSecondary }}
              />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl placeholder-gray-500 text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.teal}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={cardStyle}
            >
              <div
                className="divide-y"
                style={{ borderColor: c.divider }}
              >
                {filtered.map((item, i) => {
                  const cfg = statusConfig[item.status];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.04 * i }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: cfg.bg }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: cfg.color }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: onCardPrimary }}>
                            {item.name}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: onCardSecondary }}
                          >
                            {item.category} · Qty: {item.qty}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-xs mb-1"
                          style={{ color: onCardSecondary }}
                        >
                          {item.expiry}
                        </div>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {filtered.length === 0 && (
                  <div
                    className="px-6 py-10 text-center"
                    style={{ color: onCardSecondary }}
                  >
                    No items found.
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl p-6"
            style={cardStyle}
          >
            <h3 className="font-semibold mb-4" style={{ color: onCardPrimary }}>Stock Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0D1B2A',
                    border: '1px solid rgba(26,188,156,0.2)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {chartData.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: onCardSecondary }}
                    >
                      {d.name}
                    </span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: onCardPrimary }}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Add Food Item Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{
                background: c.cardBg,
                border: `1px solid ${c.border}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 sm:px-6 py-4"
                style={{ borderBottom: `1px solid ${c.divider}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: c.tagBg }}
                  >
                    <Plus className="w-4 h-4" style={{ color: c.teal }} />
                  </div>
                  <h2 className="text-lg font-semibold" style={{ color: onCardPrimary }}>
                    Add Food Item
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                  aria-label="Close"
                  style={{ color: onCardPrimary }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: onCardPrimary }}>
                    Item Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Basmati Rice (5kg)"
                    className="w-full px-4 py-2.5 rounded-lg placeholder-gray-500 text-sm outline-none"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.border = `1px solid ${c.teal}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: onCardPrimary }}>
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={inputStyle}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: onCardPrimary }}>
                      Quantity
                    </label>
                    <input
                      name="qty"
                      type="number"
                      min="1"
                      value={form.qty}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.border = `1px solid ${c.teal}`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: onCardPrimary }}>
                    Expiry Date
                  </label>
                  <input
                    name="expiry"
                    type="date"
                    value={form.expiry}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = `1px solid ${c.teal}`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = `1px solid ${c.inputBorder}`;
                    }}
                  />
                  <p className="text-xs mt-2" style={{ color: onCardSecondary }}>
                    Status is set automatically: ≤3 days = critical, ≤7 days =
                    warning.
                  </p>
                </div>

                {error && (
                  <div
                    className="px-3 py-2 rounded-lg text-xs"
                    style={{
                      background: 'rgba(239,68,68,0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto sm:flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: 'transparent',
                      border: `1px solid ${c.border}`,
                      color: onCardPrimary,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto sm:flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
                    style={{
                      background:
                        'linear-gradient(135deg,#1ABC9C,#0e9c80)',
                      boxShadow: '0 4px 14px rgba(26,188,156,0.3)',
                    }}
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Scan Receipt Modal (FEATURE 1) ─────────────────────────── */}
      <AnimatePresence>
        {showScan && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => !savingScan && setShowScan(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ background: c.cardBg, border: `1px solid ${c.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center justify-between px-5 sm:px-6 py-4" style={{ borderBottom: `1px solid ${c.divider}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: c.tagBg }}>
                    <ScanLine className="w-4 h-4" style={{ color: c.teal }} />
                  </div>
                  <h2 className="text-lg font-semibold" style={{ color: onCardPrimary }}>Scanned Items</h2>
                </div>
                <button onClick={() => setShowScan(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10" style={{ color: onCardPrimary }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 sm:px-6 py-5 overflow-y-auto">
                {scanning ? (
                  <div className="py-12 flex flex-col items-center gap-3" style={{ color: onCardSecondary }}>
                    <Loader2 className="w-7 h-7 animate-spin" style={{ color: c.teal }} />
                    <p className="text-sm">Reading your receipt with AI…</p>
                  </div>
                ) : (
                  <>
                    {parsed.length > 0 && (
                      <p className="text-xs mb-4" style={{ color: onCardSecondary }}>
                        Review the detected items, adjust expiry dates, then add them to your inventory.
                      </p>
                    )}
                    <div className="space-y-3">
                      {parsed.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.inputBg, border: `1px solid ${c.inputBorder}` }}>
                          <input type="checkbox" checked={it.include} onChange={() => toggleParsed(idx)} style={{ accentColor: c.teal }} />
                          <div className="flex-1 min-w-0">
                            <input
                              value={it.name}
                              onChange={(e) => editParsed(idx, 'name', e.target.value)}
                              className="w-full bg-transparent text-sm font-medium outline-none"
                              style={{ color: onCardPrimary }}
                            />
                            <div className="text-xs" style={{ color: onCardSecondary }}>
                              {it.category || 'Other'} · {it.quantity || 1} {it.unit || ''}
                            </div>
                          </div>
                          <input
                            type="date"
                            value={it.expiry}
                            onChange={(e) => editParsed(idx, 'expiry', e.target.value)}
                            className="rounded-lg text-xs outline-none px-2 py-1.5"
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {scanError && (
                  <div className="mt-4 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {scanError}
                  </div>
                )}
              </div>

              {!scanning && parsed.length > 0 && (
                <div className="flex gap-3 px-5 sm:px-6 py-4" style={{ borderTop: `1px solid ${c.divider}` }}>
                  <button onClick={() => setShowScan(false)} className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'transparent', border: `1px solid ${c.border}`, color: onCardPrimary }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveScanned} disabled={savingScan} className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-70" style={{ background: 'linear-gradient(135deg,#1ABC9C,#0e9c80)' }}>
                    {savingScan ? 'Adding…' : `Add ${parsed.filter((p) => p.include).length} item(s)`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
