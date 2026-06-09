// const asyncHandler = require('express-async-handler');
// const Item = require('../models/InventoryItem');

// exports.overview = asyncHandler(async (req, res) => {
//   const items = await Item.find({ user: req.user._id });
//   const now = Date.now();
//   const day = 1000 * 60 * 60 * 24;

//   let fresh = 0, expiring = 0, expired = 0;
//   const upcoming = [];

//   items.forEach((i) => {
//     const days = Math.ceil((new Date(i.expiry).getTime() - now) / day);
//     if (days < 0) expired++;
//     else if (days <= 3) { expiring++; upcoming.push({ name: i.name, category: i.category, days, status: days <= 1 ? 'critical' : 'warning' }); }
//     else fresh++;
//   });

//   upcoming.sort((a, b) => a.days - b.days);

//   res.json({
//     stats: {
//       totalItems: items.length,
//       expiringSoon: expiring,
//       freshItems: fresh,
//       expired,
//       deltas: { totalItems: '', expiringSoon: '', freshItems: '', expired: '' },
//     },
//     inventoryBreakdown: [
//       { name: 'Fresh', value: fresh, color: '#22c55e' },
//       { name: 'Expiring', value: expiring, color: '#f59e0b' },
//       { name: 'Expired', value: expired, color: '#ef4444' },
//     ],
//     weeklyTrend: [
//       { day: 'Mon', saved: 0, wasted: 0 },
//       { day: 'Tue', saved: 0, wasted: 0 },
//       { day: 'Wed', saved: 0, wasted: 0 },
//       { day: 'Thu', saved: 0, wasted: 0 },
//       { day: 'Fri', saved: 0, wasted: 0 },
//       { day: 'Sat', saved: 0, wasted: 0 },
//       { day: 'Sun', saved: 0, wasted: 0 },
//     ],
//     upcomingItems: upcoming.slice(0, 8),
//     recentActivity: [],
//     recipes: [],
//   });
// });

const asyncHandler = require('express-async-handler');
const Item = require('../models/InventoryItem');

exports.overview = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  // Filter inventory items by user ID - the InventoryItem model uses 'user' field
  const items = await Item.find({ user: userId }).sort({ createdAt: -1 });

  const now = new Date();
  const day = 1000 * 60 * 60 * 24;

  let fresh = 0;
  let expiring = 0;
  let expired = 0;
  const upcoming = [];

items.forEach((i) => {
  const expiryValue = i.expiry || i.expiryDate || i.expiresAt;

  if (!expiryValue) {
    fresh++;
    return;
  }

  const expiryDate = new Date(expiryValue);
  const days = Math.ceil((expiryDate.getTime() - now) / day);

  if (days < 0) {
    expired++;
  } else if (days <= 5) {
    expiring++;
    upcoming.push({
      name: i.name,
      category: i.category,
      days,
      status: days <= 1 ? 'critical' : 'warning',
    });
  } else {
    fresh++;
  }
});

  upcoming.sort((a, b) => a.days - b.days);

  res.json({
    stats: {
      totalItems: items.length,
      expiringSoon: expiring,
      freshItems: fresh,
      expired,
      deltas: {
        totalItems: '',
        expiringSoon: '',
        freshItems: '',
        expired: '',
      },
    },

    inventoryBreakdown: [
      { name: 'Fresh', value: fresh, color: '#22c55e' },
      { name: 'Expiring', value: expiring, color: '#f59e0b' },
      { name: 'Expired', value: expired, color: '#ef4444' },
    ],

    weeklyTrend: [
      { day: 'Mon', saved: 0, wasted: 0 },
      { day: 'Tue', saved: 0, wasted: 0 },
      { day: 'Wed', saved: 0, wasted: 0 },
      { day: 'Thu', saved: 0, wasted: 0 },
      { day: 'Fri', saved: 0, wasted: 0 },
      { day: 'Sat', saved: 0, wasted: 0 },
      { day: 'Sun', saved: 0, wasted: 0 },
    ],

    upcomingItems: upcoming.slice(0, 8),
    recentActivity: items.slice(0, 5).map((i) => ({
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      status: i.status,
      createdAt: i.createdAt,
    })),
    recipes: [],
  });
});