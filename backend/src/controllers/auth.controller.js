const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/emailService');

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL ERROR: JWT_SECRET environment variable is missing!');
    // Throwing error here will catch it in the try/catch block of the controller
    throw new Error('Server security configuration error (missing secret)');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      if (!userExists.isVerified) {
        // Handle unverified existing user: Resend OTP and allow them to verify
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        
        userExists.otp = otp;
        userExists.otpExpires = otpExpires;
        // Optionally update password/name if they are different, but usually better to stick to original or let them verify first
        await userExists.save();
        
        await sendOTP(email, otp);
        return res.status(200).json({
          message: 'Account already registered but not verified. A new verification code has been sent.',
          email: userExists.email,
          requiresVerification: true
        });
      }
      return res.status(400).json({ message: 'User already exists. Please sign in.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
      isVerified: false
    });

    if (user) {
      await sendOTP(email, otp);
      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        email: user.email,
        requiresVerification: true
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified. Please log in.' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTP(email, otp);
    res.json({ message: 'New verification code sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Account already verified' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
      isOnboarded: user.isOnboarded
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        // Resend OTP if not verified
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendOTP(email, otp);

        return res.status(403).json({ 
          message: 'Account not verified. New OTP sent.', 
          requiresVerification: true 
        });
      }

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        isOnboarded: user.isOnboarded
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
