const express = require("express");
const router = express.Router();
const Article = require("../models/Article");

// GET story arc by topic
router.get("/:topic", async (req, res) => {
  const { topic } = req.params;

  try {
    // 1. Get related articles
    const articles = await Article.find({
      title: { $regex: topic, $options: "i" }
    }).sort({ publishedAt: 1 });

    // 2. Timeline
    const timeline = articles.map(a => ({
      title: a.title,
      date: a.publishedAt,
      summary: a.description
    }));

    // 3. Simple sentiment
    const sentiment = articles.map(a => {
      let type = "neutral";
      if (a.title.includes("loss") || a.title.includes("fraud")) type = "negative";
      if (a.title.includes("growth") || a.title.includes("profit")) type = "positive";

      return {
        date: a.publishedAt,
        sentiment: type
      };
    });

    // 4. Entities (simple)
    const entities = [...new Set(
      articles.flatMap(a =>
        a.title.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g) || []
      )
    )];

    res.json({
      timeline,
      sentiment,
      entities
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Story arc failed" });
  }
});

module.exports = router;