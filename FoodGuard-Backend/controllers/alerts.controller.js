const asyncHandler = require('express-async-handler');
const Alert = require('../models/Alert');
const Item = require('../models/InventoryItem');

const DAY = 86400000;
const ACTIVE_STATUSES = { $nin: ['consumed', 'wasted'] };

async function cleanupOrphanAlerts(userId) {
  const activeItemIds = await Item.find({ user: userId }).distinct('_id');
  if (activeItemIds.length) {
    await Alert.deleteMany({ user: userId, item: { $nin: activeItemIds } });
  } else {
    await Alert.deleteMany({ user: userId, item: { $ne: null } });
  }
}

exports.list = asyncHandler(async (req, res) => {
  const items = await Item.find({ user: req.user._id, status: ACTIVE_STATUSES });
  await cleanupOrphanAlerts(req.user._id);
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
  const item = await Item.findOne({ _id: req.params.id, user: req.user._id, status: ACTIVE_STATUSES });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  await Alert.findOneAndUpdate(
    { user: req.user._id, item: item._id },
    { user: req.user._id, item: item._id, dismissed: true },
    { upsert: true }
  );
  res.json({ message: 'Dismissed' });
});
