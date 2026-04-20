const express = require('express');
const router = express.Router();
const { 
  getMeals, 
  createMeal, 
  updateMeal, 
  deleteMeal 
} = require('../controllers/meal.controller');
const { protect } = require('../middleware/auth.middleware');

router.route('/')
  .get(protect, getMeals)
  .post(protect, createMeal);

router.route('/:id')
  .put(protect, updateMeal)
  .delete(protect, deleteMeal);

module.exports = router;
