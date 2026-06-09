const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

exports.list = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ notifications });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ message: 'Marked as read' });
});

exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ message: 'All cleared' });
});
