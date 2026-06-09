const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { aiPost } = require('../utils/aiClient');

// FEATURE 6 — BMI calculator + personalized recommendations
exports.saveBmi = asyncHandler(async (req, res) => {
  const { height_cm, weight_kg, age, gender, healthGoal, activityLevel } = req.body;
  if (!height_cm || !weight_kg) { res.status(400); throw new Error('height_cm and weight_kg required'); }

  const data = await aiPost('/ai/health-profile', {
    weight_kg: Number(weight_kg),
    height_cm: Number(height_cm),
    age: Number(age) || 30,
    gender: gender || 'other',
    activity_level: activityLevel || req.user.activityLevel || 'moderate',
    health_goals: healthGoal ? [healthGoal] : [],
  });

  const r = data.bmi_result || {};
  const user = await User.findById(req.user._id);
  user.bmi = {
    height_cm,
    weight_kg,
    age,
    gender,
    healthGoal,
    value: r.bmi,
    category: r.bmi_category,
    dailyCalories: r.daily_calories,
    macros: {
      protein: r.macro_distribution?.protein,
      carbs: r.macro_distribution?.carbs,
      fat: r.macro_distribution?.fats ?? r.macro_distribution?.fat,
    },
    tips: r.recommendations || [],
    updatedAt: new Date(),
  };
  if (activityLevel) user.activityLevel = activityLevel;
  await user.save();

  res.json({ bmi: user.bmi, alerts: r.health_alerts || [] });
});

exports.getBmi = asyncHandler(async (req, res) => {
  res.json({ bmi: req.user.bmi || null });
});
