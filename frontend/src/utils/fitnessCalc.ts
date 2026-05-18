/**
 * FlexAI Fitness Calculation Engine
 * Uses scientifically validated formulas for accurate results.
 */

export const ACTIVITY_LEVELS = [
  {
    key: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise, desk job',
    multiplier: 1.2,
    emoji: '🪑',
  },
  {
    key: 'lightly_active',
    label: 'Lightly Active',
    description: 'Light exercise 1–3 days per week',
    multiplier: 1.375,
    emoji: '🚶',
  },
  {
    key: 'moderately_active',
    label: 'Moderately Active',
    description: 'Moderate exercise 3–5 days per week',
    multiplier: 1.55,
    emoji: '🏃',
  },
  {
    key: 'very_active',
    label: 'Very Active',
    description: 'Hard exercise 6–7 days per week',
    multiplier: 1.725,
    emoji: '🏋️',
  },
  {
    key: 'extremely_active',
    label: 'Intense Training',
    description: 'Very hard exercise + physical job, 6×/week',
    multiplier: 1.9,
    emoji: '🔥',
  },
];

/**
 * Mifflin-St Jeor BMR Equation (most clinically accurate)
 * Male:   BMR = 10×w + 6.25×h − 5×age + 5
 * Female: BMR = 10×w + 6.25×h − 5×age − 161
 *
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {string} gender - 'male' | 'female' | 'other'
 * @returns {number} BMR in kcal/day
 */
export const calculateBMR = (weightKg, heightCm, age, gender) => {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
};

/**
 * TDEE = BMR × Activity Multiplier
 */
export const calculateTDEE = (bmr, activityKey) => {
  const level = ACTIVITY_LEVELS.find(a => a.key === activityKey);
  const multiplier = level ? level.multiplier : 1.2;
  return Math.round(bmr * multiplier);
};

/**
 * Activity Burn Factor — more active people have higher EPOC & metabolic efficiency
 * Maps directly to the activity level keys set during onboarding.
 * Range: 1.0 (sedentary) → 1.35 (extremely active)
 */
const ACTIVITY_BURN_FACTOR = {
  sedentary:         1.00,
  lightly_active:    1.09,
  moderately_active: 1.18,
  very_active:       1.26,
  extremely_active:  1.35,
};

/**
 * Advanced Calorie Burn per Set
 * ─────────────────────────────────────────────────────────────────────
 * Formula:
 *   Calories = MET × UserBodyWeight × Duration_hr
 *              × IntensityMultiplier × ActivityFactor
 *
 * Variables:
 *   MET                — exercise intensity from our database
 *   UserBodyWeight     — from user's saved profile (kg)
 *   Duration_hr        — reps × 3 seconds each (concentric + eccentric)
 *   IntensityMultiplier = 1 + (weightLifted / userBodyWeight × 0.5)
 *     → Lifting your own bodyweight = 1.5× burn vs bodyweight only
 *     → Lifting 2× bodyweight (e.g. heavy deadlift) = 2.0× burn
 *   ActivityFactor     — from ACTIVITY_BURN_FACTOR map above
 *
 * @param {object} exercise      - exercise object (must have .met)
 * @param {number} userWeightKg  - user's body weight from profile
 * @param {number} reps          - reps performed this set
 * @param {number} weightLifted  - weight on the bar/machine in kg (0 for bodyweight)
 * @param {string} activityLevel - user's activity level key from profile
 * @returns {number} kcal burned for that single set
 */
export const calcCaloriesAdvanced = (
  exercise,
  userWeightKg,
  reps,
  weightLifted = 0,
  activityLevel = 'sedentary'
) => {
  const REP_DURATION_HOURS  = 3 / 3600;   // 3 seconds per rep
  const duration            = reps * REP_DURATION_HOURS;
  const intensityMultiplier = 1 + (weightLifted / userWeightKg) * 0.5;
  const activityFactor      = ACTIVITY_BURN_FACTOR[activityLevel] ?? 1.0;

  const kcal = exercise.met * userWeightKg * duration * intensityMultiplier * activityFactor;
  return Math.max(0.5, Math.round(kcal * 10) / 10);
};

/**
 * Cardio Calorie Burn
 * ─────────────────────────────────────────────────────────────────────
 * Formula:
 *   Calories = MET × UserBodyWeight × (durationMinutes / 60) × ActivityFactor
 *
 * No "weight lifted" — cardio intensity is purely time-based.
 *
 * @param {object} exercise           - exercise object (must have .met)
 * @param {number} userWeightKg       - user body weight from profile
 * @param {number} durationMinutes    - duration of the cardio set in minutes
 * @param {string} activityLevel      - user activity level key from profile
 * @returns {number} kcal burned
 */
export const calcCaloriesCardio = (
  exercise,
  userWeightKg,
  durationMinutes,
  activityLevel = 'sedentary'
) => {
  const durationHours  = durationMinutes / 60;
  const activityFactor = ACTIVITY_BURN_FACTOR[activityLevel] ?? 1.0;
  const kcal = exercise.met * userWeightKg * durationHours * activityFactor;
  return Math.max(0, Math.round(kcal * 10) / 10);
};

/**
 * Total calories burned across all COMPLETED sets of one exercise.
 * Automatically uses the correct formula based on exercise.type:
 *   'cardio'   → calcCaloriesCardio  (duration-based)
 *   'strength' → calcCaloriesAdvanced (reps + weight based)
 */
export const calcExerciseTotal = (exercise, userWeightKg, sets, activityLevel = 'sedentary') =>
  sets.reduce((total, set) => {
    if (!set.completed) return total;
    if (exercise.type === 'cardio') {
      const mins = parseFloat(set.duration) || 0;
      return total + calcCaloriesCardio(exercise, userWeightKg, mins, activityLevel);
    }
    const reps   = parseInt(set.reps)      || 0;
    const lifted = parseFloat(set.weight)  || 0;
    return total + calcCaloriesAdvanced(exercise, userWeightKg, reps, lifted, activityLevel);
  }, 0);


/**
 * Macro targets based on TDEE and goal
 * - Weight loss:   deficit 20%, higher protein
 * - Muscle gain:   surplus 15%, higher carbs
 * - Maintenance:   balanced
 */
export const getMacroTargets = (tdee, goal, weightKg, weeklyLossGoal = null) => {
  const KCAL_PER_KG = 7700;
  let calories;
  if ((goal === 'weight_loss' || goal === 'body_recomposition') && weeklyLossGoal) {
    const dailyDeficit = (weeklyLossGoal * KCAL_PER_KG) / 7;
    calories = Math.round(tdee - dailyDeficit);
    calories = Math.max(calories, 1200); // absolute safety floor
  } else if (goal === 'muscle_gain') {
    calories = Math.round(tdee + 300);
  } else {
    calories = tdee;
  }

  // Protein: 2.2g/kg for recomposition, 2g/kg otherwise (higher = more muscle retention)
  const proteinPerKg = goal === 'body_recomposition' ? 2.4 : 2.0;
  const protein = Math.round(weightKg * proteinPerKg);
  const proteinCals = protein * 4;

  // Fat: 25% of total calories
  const fat = Math.round((calories * 0.25) / 9);
  const fatCals = fat * 9;

  // Carbs: remainder
  const carbs = Math.round((calories - proteinCals - fatCals) / 4);

  return { calories, protein, carbs, fat };
};

/**
 * BMI & body status
 */
export const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let status;
  if (bmi < 18.5)      status = 'Underweight';
  else if (bmi < 25)   status = 'Normal';
  else if (bmi < 30)   status = 'Overweight';
  else                  status = 'Obese';
  return { bmi: Math.round(bmi * 10) / 10, status };
};

/**
 * Water Goal Calculation
 * Base: 35ml per kg of body weight
 * Activity Boost: extra ml based on activity level
 * Creatine Factor: 100ml extra per gram of creatine
 *
 * @param {number} weightKg
 * @param {string} activityKey
 * @param {boolean} takesCreatine
 * @param {number} creatineDose - in grams
 * @returns {number} Water goal in ml
 */
export const calculateWaterGoal = (weightKg, activityKey, takesCreatine = false, creatineDose = 0) => {
  const base = weightKg * 35;
  const boosts = {
    sedentary:          0,
    lightly_active:     350,
    moderately_active:  700,
    very_active:        1000,
    extremely_active:   1500,
  };
  const boost     = boosts[activityKey] || 0;
  const retention = takesCreatine ? (parseFloat(String(creatineDose)) || 0) * 100 : 0;
  return Math.round(base + boost + retention);
};
