const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Item = require('../models/InventoryItem');
const Alert = require('../models/Alert');
const { aiPost } = require('../utils/aiClient');

const DAY = 86400000;
const ACTIVE_STATUSES = { $nin: ['consumed', 'wasted'] };
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

async function cleanupOrphanAlerts(userId) {
  const activeItemIds = await Item.find({ user: userId }).distinct('_id');
  if (activeItemIds.length) {
    await Alert.deleteMany({ user: userId, item: { $nin: activeItemIds } });
  } else {
    await Alert.deleteMany({ user: userId, item: { $ne: null } });
  }
}

exports.list = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES }).sort({ expiry: 1 });
  await cleanupOrphanAlerts(req.user._id);
  res.json({ items });
});

exports.create = asyncHandler(async (req, res) => {
  const { name, category, qty, quantity, unit, price, expiry, notes } = req.body;
  if (!name || !expiry) { res.status(400); throw new Error('Name and expiry are required'); }
  const item = await Item.create({
    user: req.user._id, name, category, qty, quantity, unit, price, expiry, notes,
  });
  res.status(201).json({ item });
});

exports.update = asyncHandler(async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: ACTIVE_STATUSES },
    req.body,
    { new: true }
  );
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json({ item });
});

exports.consume = asyncHandler(async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, status: ACTIVE_STATUSES },
    { $set: { status: 'consumed', consumedAt: new Date() } },
    { new: true }
  );
  if (!item) { res.status(404); throw new Error('Item not found'); }
  await Alert.deleteMany({ user: req.user._id, item: item._id });
  await cleanupOrphanAlerts(req.user._id);
  res.json({ item });
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  await Alert.deleteMany({ user: req.user._id, item: item._id });
  await cleanupOrphanAlerts(req.user._id);
  res.status(204).send();
});

exports.bulkCreate = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) { res.status(400); throw new Error('items array required'); }
  const docs = items
    .filter((i) => i && i.name && i.expiry)
    .map((i) => ({
      user: req.user._id,
      name: i.name,
      category: i.category || 'Other',
      qty: i.qty || String(i.quantity || 1),
      quantity: i.quantity || 1,
      unit: i.unit || 'pcs',
      price: i.price || 0,
      expiry: i.expiry,
      notes: i.notes || '',
    }));
  if (!docs.length) { res.status(400); throw new Error('No valid items (need name + expiry)'); }
  const created = await Item.insertMany(docs);
  res.status(201).json({ items: created });
});

exports.scanReceipt = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('No image uploaded'); }

  const mimeType = String(req.file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    res.status(400);
    throw new Error('Only jpg, jpeg, png, and webp images are allowed.');
  }
  if (req.file.size > MAX_IMAGE_SIZE) {
    res.status(400);
    throw new Error('Image is too large. Maximum size is 10MB.');
  }

  let image_data;
  try {
    image_data = fs.readFileSync(req.file.path).toString('base64');
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    res.status(400); throw new Error('Could not read the uploaded image. Please try again.');
  }

  console.log('[OCR] scan-receipt start', { mimeType, size: req.file.size, base64Length: image_data.length });

  let data;
  try {
    data = await aiPost('/ai/scan-receipt', { image_data, mime_type: mimeType }, { timeout: 90000, retries: 3 });
  } finally {
    fs.unlink(req.file.path, () => {});
  }

  console.log('[OCR] scan-receipt success', { itemsCount: (data.items || []).length });

  const now = Date.now();
  const items = (data.items || []).map((it) => {
    const days = Number(it.estimated_expiry_days) || 7;
    return {
      name: it.name,
      category: it.category || 'Other',
      quantity: parseFloat(it.quantity) || 1,
      qty: it.quantity ? String(it.quantity) : '1',
      unit: it.unit || 'pcs',
      estimatedExpiryDays: days,
      expiry: new Date(now + days * DAY).toISOString(),
      confidence: it.confidence,
    };
  });
  res.json({ items, rawText: data.raw_text || '' });
});

exports.wastageReport = asyncHandler(async (req, res) => {
  const now = Date.now();
  const items = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES });
  const expired = [];
  const expiringSoon = [];
  items.forEach((i) => {
    const days = Math.ceil((new Date(i.expiry).getTime() - now) / DAY);
    const payload = { name: i.name, quantity: i.quantity || 1, value_pkr: i.price || 0, category: i.category };
    if (i.status === 'wasted' || days < 0) expired.push(payload);
    else if (days <= 3) expiringSoon.push(payload);
  });

  const data = await aiPost('/ai/wastage-report', { expired_items: expired, expiring_soon: expiringSoon });
  res.json(data);
});
