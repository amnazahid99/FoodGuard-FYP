const asyncHandler = require('express-async-handler');
const User = require('../models/User');

exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, bio, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  res.json({ profile: user });
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401); throw new Error('Current password incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});

exports.getPreferences = asyncHandler(async (req, res) => {
  res.json({ preferences: req.user.preferences });
});

exports.updatePreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.preferences = { ...user.preferences.toObject(), ...req.body };
  await user.save();
  res.json({ preferences: user.preferences });
});

exports.updateNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.notifications = { ...user.notifications.toObject(), ...req.body };
  await user.save();
  res.json({ notifications: user.notifications });
});

// Health profile endpoints for AI meal personalization
exports.getHealthProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('healthCondition dietaryPreference activityLevel bmi');
  res.json({
    healthCondition: user.healthCondition,
    dietaryPreference: user.dietaryPreference,
    activityLevel: user.activityLevel,
    bmi: user.bmi
  });
});

exports.updateHealthProfile = asyncHandler(async (req, res) => {
  const { healthCondition, dietaryPreference, activityLevel, bmi } = req.body;
  const user = await User.findById(req.user._id);
  if (healthCondition !== undefined) user.healthCondition = healthCondition;
  if (dietaryPreference !== undefined) user.dietaryPreference = dietaryPreference;
  if (activityLevel !== undefined) user.activityLevel = activityLevel;
  if (bmi !== undefined) user.bmi = bmi;
  await user.save();
  res.json({
    healthCondition: user.healthCondition,
    dietaryPreference: user.dietaryPreference,
    activityLevel: user.activityLevel,
    bmi: user.bmi
  });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.json({ message: 'Account deleted' });
});
