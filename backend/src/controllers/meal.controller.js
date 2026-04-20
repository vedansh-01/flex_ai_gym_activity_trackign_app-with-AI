const Meal = require('../models/Meal');

// Helper: compute totals from a foods array
function computeTotals(foods) {
  return {
    totalCalories: foods.reduce((s, f) => s + (f.calories || 0), 0),
    macros: {
      protein: foods.reduce((s, f) => s + (f.protein || 0), 0),
      carbs:   foods.reduce((s, f) => s + (f.carbs   || 0), 0),
      fats:    foods.reduce((s, f) => s + (f.fats    || 0), 0),
    }
  };
}

// @desc    Get user meals (optionally filtered by date range)
// @route   GET /api/meals?days=3
// @access  Private
const getMeals = async (req, res) => {
  try {
    const { days } = req.query;
    const query = { user: req.user.id };

    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      query.date = { $gte: cutoff };
    }

    const meals = await Meal.find(query).sort({ date: -1 });
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new meal log
// @route   POST /api/meals
// @access  Private
const createMeal = async (req, res) => {
  const { name, foods, date } = req.body;

  if (!name || !Array.isArray(foods) || foods.length === 0) {
    return res.status(400).json({ message: 'Please provide meal name and at least one food item.' });
  }

  try {
    const { totalCalories, macros } = computeTotals(foods);

    const meal = await Meal.create({
      user: req.user.id,
      name,
      foods,
      totalCalories,
      macros,
      date: date || Date.now(),
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error('createMeal error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a meal log
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) return res.status(404).json({ message: 'Meal not found.' });
    if (meal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized.' });

    // Recompute totals if foods are being updated
    const updateBody = { ...req.body };
    if (Array.isArray(updateBody.foods) && updateBody.foods.length > 0) {
      const { totalCalories, macros } = computeTotals(updateBody.foods);
      updateBody.totalCalories = totalCalories;
      updateBody.macros = macros;
    }

    const updated = await Meal.findByIdAndUpdate(req.params.id, updateBody, { new: true, runValidators: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error('updateMeal error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a meal log
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);

    if (!meal) return res.status(404).json({ message: 'Meal not found.' });
    if (meal.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized.' });

    await meal.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    console.error('deleteMeal error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
