const Workout = require('../models/Workout');

// @desc    Get user workouts
// @route   GET /api/workouts
// @access  Private
const getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new workout log
// @route   POST /api/workouts
// @access  Private
const createWorkout = async (req, res) => {
  const { name, exercises, duration, totalCaloriesBurned } = req.body;

  if (!name || !exercises || exercises.length === 0) {
    return res.status(400).json({ message: 'Please add workout name and exercises' });
  }

  let totalVolume = 0;
  exercises.forEach(ex => {
    ex.sets.forEach(set => { totalVolume += (set.reps * set.weight); });
  });

  try {
    const workout = await Workout.create({
      user: req.user.id,
      name,
      exercises: exercises.map(ex => ({
        name: ex.name,
        muscleGroups: ex.muscleGroup ? [ex.muscleGroup] : [],
        sets: ex.sets,
        notes: ex.notes || '',
      })),
      duration,
      totalVolume,
      totalCaloriesBurned: totalCaloriesBurned || 0,
    });
    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a past workout (reps, weight, name)
// @route   PUT /api/workouts/:id
// @access  Private
const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (workout.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to edit this workout' });

    const { name, exercises, totalCaloriesBurned } = req.body;

    // Recalculate totalVolume from updated sets
    let totalVolume = 0;
    const updatedExercises = exercises || workout.exercises;
    updatedExercises.forEach(ex => {
      (ex.sets || []).forEach(set => {
        totalVolume += ((set.reps || 0) * (set.weight || 0));
      });
    });

    if (name) workout.name = name;
    if (exercises) workout.exercises = updatedExercises;
    if (totalCaloriesBurned != null) workout.totalCaloriesBurned = totalCaloriesBurned;
    workout.totalVolume = totalVolume;

    const updated = await workout.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a workout
// @route   DELETE /api/workouts/:id
// @access  Private
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findById(req.params.id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (workout.user.toString() !== req.user.id)
      return res.status(401).json({ message: 'Not authorized to delete this workout' });

    await workout.deleteOne();
    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWorkouts, createWorkout, updateWorkout, deleteWorkout };
