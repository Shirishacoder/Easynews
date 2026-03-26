const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /user/onboarding
// @desc    Update user language and interests
router.post('/onboarding', protect, async (req, res) => {
  try {
    const { language, interests } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.languagePreference = language || user.languagePreference;
      user.interests = interests || user.interests;

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
