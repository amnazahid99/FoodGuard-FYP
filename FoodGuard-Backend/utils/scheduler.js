const cron = require('node-cron');
const User = require('../models/User');
const Item = require('../models/InventoryItem');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { aiPost } = require('./aiClient');

const DAY = 86400000;

// FEATURE 5 — daily expiry scan: refresh alerts (+AI tips) and notify users.
async function runExpiryScan() {
  const now = Date.now();
  const users = await User.find({ 'notifications.expiryAlerts': true });

  for (const user of users) {
    try {
      const items = await Item.find({ user: user._id, status: { $nin: ['consumed', 'wasted'] } });
      const expiring = items
        .map((i) => ({ item: i, days: Math.ceil((new Date(i.expiry).getTime() - now) / DAY) }))
        .filter((x) => x.days <= 7);
      if (!expiring.length) continue;

      // AI usage tips (best effort — alerts still work without them)
      const tipMap = {};
      try {
        const data = await aiPost('/ai/expiry-tips', {
          expiring_items: expiring.map((x) => ({ name: x.item.name, days_left: x.days })),
        });
        (data.tips || []).forEach((t) => { tipMap[(t.item_name || '').toLowerCase()] = t; });
      } catch (e) {
        console.warn('[cron] expiry-tips unavailable:', e.message);
      }

      for (const { item, days } of expiring) {
        const status = days <= 1 ? 'critical' : days <= 3 ? 'warning' : 'info';
        const t = tipMap[item.name.toLowerCase()] || {};
        await Alert.findOneAndUpdate(
          { user: user._id, item: item._id },
          {
            $set: {
              itemName: item.name,
              daysLeft: days,
              status,
              tip: t.tip || null,
              suggestedRecipe: t.suggested_recipe || null,
            },
            $setOnInsert: { dismissed: false },
          },
          { upsert: true }
        );
      }

      // One summary notification per day
      const critical = expiring.filter((x) => x.days <= 1).length;
      const title = `${expiring.length} item(s) expiring soon`;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const exists = await Notification.findOne({ user: user._id, title, createdAt: { $gte: startOfDay } });
      if (!exists) {
        await Notification.create({
          user: user._id,
          title,
          message: critical ? `${critical} item(s) expire within 24 hours.` : 'Check your expiry alerts.',
          type: critical ? 'error' : 'warning',
        });
      }
    } catch (e) {
      console.error(`[cron] expiry scan failed for user ${user._id}:`, e.message);
    }
  }
}

function startScheduler() {
  // Daily at 08:00 server time
  cron.schedule('0 8 * * *', () => {
    console.log('[cron] Running daily expiry scan...');
    runExpiryScan().catch((e) => console.error('[cron] expiry scan error:', e));
  });
  console.log('Expiry alert scheduler started (daily 08:00)');
}

module.exports = { startScheduler, runExpiryScan };
