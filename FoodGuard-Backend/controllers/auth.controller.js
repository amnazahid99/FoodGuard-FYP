const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('All fields required'); }

  const exists = await User.findOne({ email });
  if (exists) { res.status(409); throw new Error('Email already in use'); }

  const user = await User.create({ name, email, password });
  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  res.status(201).json({ token, refreshToken, user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  const token = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);
  res.json({ token, refreshToken, user });
});

exports.logout = asyncHandler(async (_req, res) => {
  res.json({ message: 'Logged out' });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401); throw new Error('No refresh token'); }
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = signAccessToken(decoded.id);
    res.json({ token });
  } catch {
    res.status(401); throw new Error('Invalid refresh token');
  }
});

exports.profile = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();
    // TODO: send via nodemailer; for now expose for dev
    if (process.env.NODE_ENV === 'development') {
      return res.json({ message: 'Reset link sent', devToken: resetToken });
    }
  }
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) { res.status(400); throw new Error('Invalid or expired token'); }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({ message: 'Password reset successful' });
});
