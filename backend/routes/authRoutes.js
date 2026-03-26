const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// @route   GET /auth/google
// @desc    Auth with Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

// @route   GET /auth/google/callback
// @desc    Google auth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/', session: false }),
  (req, res) => {
    const token = generateToken(req.user._id);
    setTokenCookie(res, token);
    res.redirect(`${process.env.CLIENT_URL}/`);
  }
);

// @route   POST /auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      languagePreference: 'English',
      interests: []
    });

    if (user) {
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        languagePreference: user.languagePreference,
        interests: user.interests
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /auth/login
// @desc    Auth user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      setTokenCookie(res, token);
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        languagePreference: user.languagePreference,
        interests: user.interests
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

const { protect } = require('../middleware/auth');

// @route   GET /auth/user
// @desc    Get current logged in user
router.get('/user', protect, (req, res) => {
  res.json(req.user);
});

// @route   POST /auth/logout
// @desc    Logout user / clear cookie
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
