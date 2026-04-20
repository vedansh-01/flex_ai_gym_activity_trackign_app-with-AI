const express = require('express');
const router = express.Router();
const { searchFoods } = require('../controllers/food.controller');
const { protect } = require('../middleware/auth.middleware');

// Public or Protected - making it protected to ensure only logged in users hit it
router.get('/search', protect, searchFoods);

module.exports = router;
