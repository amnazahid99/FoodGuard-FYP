const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');
const Item = require('../models/InventoryItem');

const DAY = 86400000;

// FEATURE 5 — smart expiry alerts.
// Always computed fresh from inventory dates; enriched with AI tips and
// dismissed-flags persisted by the daily cron job (see utils/scheduler.js).
exports.list = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, status: { $nin: ['consumed', 'wasted'] } });
  const now = Date.now();

  const stored = await Alert.find({ user: req.user._id });
  const byItem = {};
  stored.forEach((a) => { if (a.item) byItem[String(a.item)] = a; });

  const alerts = items
    .map((i) => {
      const days = Math.ceil((new Date(i.expiry).getTime() - now) / DAY);
      const status = days <= 1 ? 'critical' : days <= 3 ? 'warning' : days <= 7 ? 'info' : 'good';
      const s = byItem[String(i._id)];
      return {
        _id: String(i._id),
        itemName: i.name,
        category: i.category,
        daysLeft: days,
        status,
        tip: s?.tip || null,
        suggestedRecipe: s?.suggestedRecipe || null,
        dismissed: s?.dismissed || false,
      };
    })
    .filter((a) => a.daysLeft <= 7 && !a.dismissed);

  alerts.sort((a, b) => a.daysLeft - b.daysLeft);
  res.json({ alerts });
});

exports.dismiss = asyncHandler(async (req, res) => {
  await Alert.findOneAndUpdate(
    { user: req.user._id, item: req.params.id },
    { user: req.user._id, item: req.params.id, dismissed: true },
    { upsert: true }
  );
  res.json({ message: 'Dismissed' });
});
