const asyncHandler = require('express-async-handler');
const ContactMessage = require('../models/ContactMessage');

exports.submit = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) { res.status(400); throw new Error('Missing required fields'); }
  await ContactMessage.create({ name, email, subject, message });
  res.status(201).json({ message: 'Message received' });
});
