const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true },
  time: String,
  uses: String,
  ingredients: [String],
  instructions: [String],
  image: String,
  saved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Recipe', recipeSchema);
