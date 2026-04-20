const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getHistory, sendTextMessage } = require('../controllers/chat.controller');

// Protected routes
router.get('/history', protect, getHistory);
router.post('/send', protect, sendTextMessage);

module.exports = router;
