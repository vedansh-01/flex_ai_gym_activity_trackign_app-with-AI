const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, resendOTP } = require('../controllers/auth.controller');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);

module.exports = router;
