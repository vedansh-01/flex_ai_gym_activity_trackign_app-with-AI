const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkSubscription } = require('../middleware/checkSubscription');
const { sendTextMessage } = require('../controllers/chat.controller');

// Protected AI Chat route (Fully Locked)
router.post('/send', protect, checkSubscription, sendTextMessage);

module.exports = router;
