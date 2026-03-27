const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Article = require("../models/Article");
const { getMLRecommendations } = require("../services/mlService");
const fetchNewsAndStore = require("../services/newsService");

router.get("/:userId", async (req, res) => {
  try {

    await fetchNewsAndStore();
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const allArticles = await Article.find().sort({ publishedAt: -1 });

    if (!allArticles.length) {
      return res.json([]);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const recommended = await getMLRecommendations(allArticles, user, page, limit);

    res.json(recommended);

  } catch (err) {
    console.error("❌ Recommendation Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;