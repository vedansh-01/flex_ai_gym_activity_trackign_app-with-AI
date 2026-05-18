const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');
const { generateWorkout, generateMealPlan } = require('../controllers/ai.controller');
const { getStatus, activateCode } = require('../controllers/subscription.controller');

// ─── Subscription Access Endpoints ───────────────────────────────────────────
router.get('/subscription/status', protect, getStatus);
router.post('/subscription/activate', protect, activateCode);

// ─── Secure AI Generation (Fully Locked) ─────────────────────────────────────
router.post('/workout', protect, checkSubscription, generateWorkout);
router.post('/meal-plan', protect, checkSubscription, generateMealPlan);

module.exports = router;
