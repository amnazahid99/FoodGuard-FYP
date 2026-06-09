const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  // Extract token from Authorization header or cookies
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      res.status(401);
      throw new Error('User not found');
    }
    // Lazily revert an expired paid plan to free so limits + the UI stay correct.
    const end = req.user.subscription && req.user.subscription.currentPeriodEnd;
    if (req.user.plan && req.user.plan !== 'free' && end && new Date(end).getTime() < Date.now()) {
      req.user.plan = 'free';
      req.user.subscription.status = 'expired';
      await req.user.save();
    }
    next();
  } catch (e) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});
