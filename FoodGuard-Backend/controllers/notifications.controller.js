const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

exports.list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const transformed = notifications.map(n => ({
    id: n._id,
    title: n.title,
    body: n.message,
    type: n.type || 'info',
    read: n.read || false,
    time: n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  }));
  res.json({ notifications: transformed });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ message: 'Marked as read' });
});

exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ message: 'All cleared' });
});
