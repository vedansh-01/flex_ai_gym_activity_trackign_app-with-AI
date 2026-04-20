const mongoose = require('mongoose');

const setSchema = new mongoose.Schema({
  reps: { type: Number, required: true },
  weight: { type: Number, required: true },
  rpe: { type: Number }, // Rate of Perceived Exertion
});

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  muscleGroups: [String],
  sets: [setSchema],
  notes: String,
});

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  exercises: [exerciseSchema],
  duration: Number,
  totalVolume: Number,
  totalCaloriesBurned: { type: Number, default: 0 },
  bodyWeight: { type: Number, default: null }, // kg — recorded at time of workout
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
