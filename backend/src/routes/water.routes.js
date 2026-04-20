const express = require('express');
const router = express.Router();
const { getTodayWater, addWater, deleteWater } = require('../controllers/water.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // All water routes are protected

router.get('/today', getTodayWater);
router.post('/', addWater);
router.delete('/:id', deleteWater);

module.exports = router;
