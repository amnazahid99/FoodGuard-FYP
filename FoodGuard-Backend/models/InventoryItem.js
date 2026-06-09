const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, default: 'Other' },
  qty: { type: String, default: '1' },              // display string (kept for compatibility)
  quantity: { type: Number, default: 1 },           // numeric amount (for analytics)
  unit: { type: String, default: 'pcs' },
  price: { type: Number, default: 0 },              // estimated value (PKR) for waste loss calc
  expiry: { type: Date, required: true },
  status: {
    type: String,
    enum: ['fresh', 'expiring', 'expired', 'consumed', 'wasted'],
    default: 'fresh',
  },
  consumedAt: Date,
  wastedAt: Date,
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', inventorySchema);
