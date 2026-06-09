const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  preferences: {
    theme: { type: String, default: 'light' },
    language: { type: String, default: 'en' },
    units: { type: String, default: 'metric' },
    // Drive AI meal personalisation (set from the Settings → Preferences tab).
    diet: { type: String, default: 'omnivore' },     // omnivore | vegetarian | vegan | pescatarian | keto
    cuisine: { type: String, default: '' },          // e.g. pakistani | indian | mediterranean | asian
    expiryWarning: { type: Number, default: 3 },     // days before expiry to warn
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    expiryAlerts: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },
  },
  // Billing / subscription (kept in sync by Stripe webhooks)
  plan: { type: String, enum: ['free', 'pro', 'family'], default: 'free' },
  stripeCustomerId: { type: String, default: '' },
  subscription: {
    status: { type: String, default: '' },           // 'active' | 'expired' | ''
    billing: { type: String, default: '' },           // 'monthly' | 'yearly'
    currentPeriodEnd: Date,                            // computed: now + 1 month / 1 year
    lastPaymentId: { type: String, default: '' },      // Stripe checkout session id (idempotency)
  },
  // Free-tier usage counter for the weekly AI-recipe quota
  aiUsage: {
    weekStart: Date,
    recipeCount: { type: Number, default: 0 },
  },
  // Health profile (drives AI meal/nutrition personalisation)
  healthCondition: {
    type: String,
    enum: ['none', 'diabetes', 'hypertension', 'heart_disease', 'weight_loss'],
    default: 'none',
  },
  dietaryPreference: { type: String, default: 'none' },
  activityLevel: { type: String, default: 'moderate' },
  bmi: {
    height_cm: Number,
    weight_kg: Number,
    age: Number,
    gender: String,
    healthGoal: String,
    value: Number,
    category: String,
    dailyCalories: Number,
    macros: { protein: Number, carbs: Number, fat: Number },
    tips: [String],
    updatedAt: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
