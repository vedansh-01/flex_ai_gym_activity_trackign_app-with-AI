const User = require('../models/User');

// ─── Constants ────────────────────────────────────────────────────────────────
const KCAL_PER_KG_FAT = 7700; // 1 kg body fat ≈ 7700 kcal

const ACTIVITY_MULTIPLIERS = {
  sedentary:          1.2,
  lightly_active:     1.375,
  moderately_active:  1.55,
  very_active:        1.725,
  extremely_active:   1.9,
};

const WATER_ACTIVITY_BOOSTS = {
  sedentary:          0,
  lightly_active:     350,
  moderately_active:  700,
  very_active:        1000,
  extremely_active:   1500,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mifflin-St Jeor BMR */
const calcBMR = (weight, height, age, gender) => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
};

/** TDEE = BMR × activity multiplier */
const calcTDEE = (bmr, activityLevel) => {
  const m = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * m);
};

/**
 * Target calories based on goal + weekly loss rate
 *   weight_loss / body_recomposition: TDEE − daily deficit
 *   muscle_gain:  TDEE + 300 kcal surplus
 *   maintenance:  TDEE
 * Always floored at (BMR + 200) for safety.
 */
const calcTargetCalories = (tdee, bmr, goal, weeklyLossGoal) => {
  let target = tdee;
  if ((goal === 'weight_loss' || goal === 'body_recomposition') && weeklyLossGoal) {
    const dailyDeficit = (weeklyLossGoal * KCAL_PER_KG_FAT) / 7;
    target = Math.round(tdee - dailyDeficit);
    target = Math.max(target, Math.round(bmr + 200)); // safety floor
  } else if (goal === 'muscle_gain') {
    target = Math.round(tdee + 300);
  }
  return target;
};

/**
 * Water goal calculation
 * Base: 35ml / kg
 * Boost: activity level + creatine retention (100ml / g)
 */
const calcWaterGoal = (weight, activityLevel, takesCreatine, creatineDose) => {
  const base = weight * 35;
  const boost = WATER_ACTIVITY_BOOSTS[activityLevel] || 0;
  const retention = takesCreatine ? (Number(creatineDose) || 0) * 100 : 0;
  return Math.round(base + boost + retention);
};

// ─── GET /api/users/profile ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { 
    name, age, gender, weight, height, activityLevel, 
    goal, weeklyLossGoal, takesCreatine, creatineDose, workoutTime 
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update top-level name
    if (name) user.name = name;

    // Update profile fields
    if (age)            user.profile.age           = Number(age);
    if (gender)         user.profile.gender        = gender;
    if (weight)         user.profile.weight        = Number(weight);
    if (height)         user.profile.height        = Number(height);
    if (activityLevel)  user.profile.activityLevel = activityLevel;
    if (goal)           user.profile.goal          = goal;
    if (weeklyLossGoal !== undefined && weeklyLossGoal !== null) {
      user.profile.weeklyLossGoal = Number(weeklyLossGoal);
    }
    if (takesCreatine !== undefined) user.profile.takesCreatine = !!takesCreatine;
    if (creatineDose !== undefined)   user.profile.creatineDose  = Number(creatineDose) || 0;
    if (workoutTime)                 user.profile.workoutTime   = workoutTime;

    // Recalculate BMR, TDEE, and targetCalories whenever we have all required fields
    const p = user.profile;
    if (p.weight && p.height && p.age && p.gender && p.activityLevel) {
      const bmr  = calcBMR(p.weight, p.height, p.age, p.gender);
      const tdee = calcTDEE(bmr, p.activityLevel);
      user.profile.bmr            = Math.round(bmr);
      user.profile.tdee           = tdee;
      user.profile.targetCalories = calcTargetCalories(tdee, bmr, p.goal, p.weeklyLossGoal);
      user.profile.waterGoal      = calcWaterGoal(p.weight, p.activityLevel, p.takesCreatine, p.creatineDose);
      user.isOnboarded = true;
    }

    // CRITICAL: tell Mongoose the nested profile object has changed
    user.markModified('profile');

    const saved = await user.save();

    console.log(`✅ Profile saved for ${saved.email}:`, {
      weight: saved.profile.weight, height: saved.profile.height,
      age: saved.profile.age, gender: saved.profile.gender,
      goal: saved.profile.goal, tdee: saved.profile.tdee,
      targetCalories: saved.profile.targetCalories,
      isOnboarded: saved.isOnboarded,
    });

    res.json({
      _id:         saved._id,
      name:        saved.name,
      email:       saved.email,
      profile:     saved.profile,
      isOnboarded: saved.isOnboarded,
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProfile, updateProfile };
