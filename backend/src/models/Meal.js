const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { 
    type: String, 
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] 
  },
  foods: [{
    name:     { type: String, required: true },
    quantity: { type: Number, required: true },
    unit:     { type: String, default: 'g' },
    calories: { type: Number, required: true },
    protein:  { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fats:     { type: Number, default: 0 },
  }],
  totalCalories: { type: Number, default: 0 },
  macros: {
    protein: { type: Number, default: 0 },
    carbs:   { type: Number, default: 0 },
    fats:    { type: Number, default: 0 },
  },
  date:  { type: Date, default: Date.now },
  image: { type: String },
}, { timestamps: true });

// NOTE: Totals are computed in the controller before saving — no pre-save hook needed.

module.exports = mongoose.model('Meal', mealSchema);
