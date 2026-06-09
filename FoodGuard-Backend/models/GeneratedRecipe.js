const mongoose = require('mongoose');

/**
 * Cache of AI-recommended recipes so the Recipe Detail page can be re-opened
 * (refresh / direct link / "back") and still resolve the *correct* recipe by
 * its stable id — the recommend endpoint hands out a deterministic hash id
 * (not a Mongo ObjectId), so it can't be looked up in the curated Recipe
 * collection. We persist the full card payload keyed by (user, recipeId).
 */
const generatedRecipeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipeId: { type: String, required: true, index: true }, // the stable hash id from recommend()
    data: { type: mongoose.Schema.Types.Mixed, default: {} }, // full recipe object returned to the UI
  },
  { timestamps: true }
);

generatedRecipeSchema.index({ user: 1, recipeId: 1 }, { unique: true });

module.exports = mongoose.model('GeneratedRecipe', generatedRecipeSchema);
