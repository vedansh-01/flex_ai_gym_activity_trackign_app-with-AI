const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profile: {
    height: { type: Number, default: null },   // cm
    weight: { type: Number, default: null },   // kg
    age:    { type: Number, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
      default: null,
    },
    goal: { type: String, enum: ['weight_loss', 'muscle_gain', 'maintenance', 'body_recomposition'], default: 'maintenance' },
    weeklyLossGoal: { type: Number, default: null }, // kg/week — 0.25, 0.5, 0.75, 1.0
    // Pre-calculated on every profile save for fast reads
    bmr:            { type: Number, default: null },
    tdee:           { type: Number, default: null },
    targetCalories: { type: Number, default: null }, // adjusted for goal + weekly loss
    // Water & Supplements
    takesCreatine:  { type: Boolean, default: false },
    creatineDose:   { type: Number, default: 0 },    // grams
    waterGoal:      { type: Number, default: 2500 }, // ml
    workoutTime:    { type: String, default: "17:00" }, // HH:MM format
  },
  isOnboarded: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
});

// Hash password before saving
// NOTE: async Mongoose middleware resolves via Promise — do NOT use next() callback
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
