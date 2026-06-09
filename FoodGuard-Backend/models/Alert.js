const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
  itemName: String,
  daysLeft: Number,
  status: { type: String, enum: ['critical', 'warning', 'info'], default: 'warning' },
  tip: { type: String, default: null },
  suggestedRecipe: { type: String, default: null },
  dismissed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
