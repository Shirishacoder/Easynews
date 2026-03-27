const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   POST /user/onboarding
// @desc    Update user language and interests
router.post('/onboarding', protect, async (req, res) => {
  try {
    const { profession, interests } = req.body; // ✅ FIXED

    const user = await User.findById(req.user._id);

    if (user) {
      user.profession = profession || user.profession; // ✅ works now
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
// GET COMMENTS FOR ARTICLE
router.get("/comments/:articleId", async (req, res) => {
  try {
    const comments = await Activity.find({
      articleId: req.params.articleId,
      actionType: "comment"
    }).sort({ timestamp: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});
module.exports = router;
