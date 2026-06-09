const mongoose = require('mongoose');

const nutritionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true }, // YYYY-MM-DD (one log per user per day)
  foodItems: [{ name: String, quantity_grams: Number }],
  totals: {
    calories: { type: Number, default: 0 },
    protein_g: { type: Number, default: 0 },
    carbs_g: { type: Number, default: 0 },
    fat_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    sugar_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 },
  },
  healthScore: { type: Number, default: 0 },
  tips: [String],
  dailyTargets: { type: mongoose.Schema.Types.Mixed, default: {} },
  breakdown: { type: mongoose.Schema.Types.Mixed, default: [] },
  source: { type: String, default: 'calorieninjas' },
}, { timestamps: true });

nutritionLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('NutritionLog', nutritionLogSchema);
