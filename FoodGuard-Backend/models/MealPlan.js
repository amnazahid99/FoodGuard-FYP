const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  condition: { type: String, default: 'none' },
  weekPlan: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
