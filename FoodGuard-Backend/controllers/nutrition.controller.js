const asyncHandler = require('express-async-handler');
const NutritionLog = require('../models/NutritionLog');
const { aiPost } = require('../utils/aiClient');

const todayStr = () => new Date().toISOString().slice(0, 10);

const normOne = (i) =>
  typeof i === 'string'
    ? { name: i }
    : { name: i.name, quantity_grams: i.quantity_grams ?? i.grams ?? undefined };

function normalizeItems(body) {
  if (Array.isArray(body.foodItems)) return body.foodItems.map(normOne);
  if (Array.isArray(body.food_items)) return body.food_items.map(normOne);
  if (body.foodItem) return [normOne(body.foodItem)];
  return [];
}

// FEATURE 3 — nutrition analyzer (accumulates per-day log)
exports.analyze = asyncHandler(async (req, res) => {
  const newItems = normalizeItems(req.body).filter((i) => i.name);
  if (!newItems.length) { res.status(400); throw new Error('Provide foodItems'); }

  const date = todayStr();
  const existing = await NutritionLog.findOne({ user: req.user._id, date });
  const allItems = (existing?.foodItems || []).concat(newItems);

  const data = await aiPost('/ai/analyze-nutrition', { food_items: allItems });

  const log = await NutritionLog.findOneAndUpdate(
    { user: req.user._id, date },
    {
      user: req.user._id,
      date,
      foodItems: allItems,
      totals: data.totals,
      healthScore: data.health_score,
      tips: data.tips,
      dailyTargets: data.daily_targets,
      breakdown: data.breakdown,
      source: data.source,
    },
    { new: true, upsert: true }
  );
  res.json({ log });
});

exports.today = asyncHandler(async (req, res) => {
  const log = await NutritionLog.findOne({ user: req.user._id, date: todayStr() });
  res.json({ log: log || null });
});

exports.report = asyncHandler(async (req, res) => {
  const logs = await NutritionLog.find({ user: req.user._id }).sort({ date: -1 }).limit(7);
  const weekly = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const daily = logs.map((l) => {
    const t = l.totals?.toObject ? l.totals.toObject() : (l.totals || {});
    weekly.calories += t.calories || 0;
    weekly.protein += t.protein_g || 0;
    weekly.carbs += t.carbs_g || 0;
    weekly.fat += t.fat_g || 0;
    return { date: l.date, ...t, healthScore: l.healthScore };
  });
  res.json({ weekly, daily });
});
