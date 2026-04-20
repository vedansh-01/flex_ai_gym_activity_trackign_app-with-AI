const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true,
  },
  calories: {
    type: Number,
    required: true,
  },
  carbs: {
    type: Number,
    required: true,
  },
  protein: {
    type: Number,
    required: true,
  },
  fats: {
    type: Number,
    required: true,
  },
  sugar: {
    type: Number,
    default: 0,
  },
  fiber: {
    type: Number,
    default: 0,
  },
  sodium: {
    type: Number,
    default: 0,
  },
  calcium: {
    type: Number,
    default: 0,
  },
  iron: {
    type: Number,
    default: 0,
  },
  vitaminC: {
    type: Number,
    default: 0,
  },
  // For piece-based foods (chapati, idli, egg, etc.)
  // servingUnit: 'g' (default) or 'piece'
  // gramsPerUnit: how many grams 1 piece weighs (null for gram-based foods)
  servingUnit:  { type: String, default: 'g' },
  gramsPerUnit: { type: Number, default: null },
}, { timestamps: true });

// Add a text index for name search
foodSchema.index({ name: 'text' });

module.exports = mongoose.model('Food', foodSchema);
