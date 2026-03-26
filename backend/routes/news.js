const express = require("express");
const router = express.Router();
const fetchNews = require("../services/newsService");
const Article = require("../models/Article");

// 🔹 Clean URL
const cleanUrl = (url) => (url ? url.split("?")[0] : "");

// 🔹 Smart Categorization (IMPORTANT ✅)
const categorizeArticle = (article) => {
  const text = (article.title + " " + article.description).toLowerCase();

  // 💰 Finance
  if (text.includes("stock") || text.includes("market") || text.includes("crypto") || text.includes("finance") || text.includes("investment"))
    return "Finance";

  // 🏛 Politics
  if (text.includes("election") || text.includes("government") || text.includes("minister") || text.includes("policy") || text.includes("parliament"))
    return "Politics";

  // 📊 Economy
  if (text.includes("economy") || text.includes("inflation") || text.includes("gdp") || text.includes("economic"))
    return "Economy";

  // 🚀 Startups (separate category 🔥)
  if (text.includes("startup") || text.includes("funding") || text.includes("venture") || text.includes("founder"))
    return "Startups";

  // 🏢 Business
  if (text.includes("company") || text.includes("business") || text.includes("industry") || text.includes("corporate"))
    return "Business";

  // 💻 Technology
  if (text.includes("ai") || text.includes("software") || text.includes("technology") || text.includes("app") || text.includes("tech"))
    return "Technology";

  // ⚽ Sports
  if (text.includes("cricket") || text.includes("football") || text.includes("match") || text.includes("tournament") || text.includes("league"))
    return "Sports";

  // 🎬 Entertainment
  if (text.includes("movie") || text.includes("celebrity") || text.includes("film") || text.includes("music") || text.includes("actor"))
    return "Entertainment";

  // 🏥 Health
  if (text.includes("health") || text.includes("disease") || text.includes("hospital") || text.includes("medical"))
    return "Health";

  // 🔬 Science
  if (text.includes("science") || text.includes("space") || text.includes("research") || text.includes("nasa"))
    return "Science";

  return "General";
};
// 🔹 Fetch + Store News (UPDATED 🚀)
router.get("/fetch-news", async (req, res) => {
  try {
    // ✅ SINGLE API CALL (fixes your issue)
    const articles = await fetchNews();

    console.log("📰 Total fetched:", articles.length);

    // ✅ Remove duplicates by Title and URL
    const seenUrls = new Set();
    const seenTitles = new Set();
    const uniqueArticles = [];

    for (let art of articles) {
      const url = cleanUrl(art.url);
      const title = art.title?.trim().toLowerCase();

      if (url && title && !seenUrls.has(url) && !seenTitles.has(title) && title !== "[removed]") {
        seenUrls.add(url);
        seenTitles.add(title);
        uniqueArticles.push(art);
      }
    }

    console.log("✨ Unique articles:", uniqueArticles.length);

    let savedCount = 0;

    // ✅ Save to DB
    for (let art of uniqueArticles.slice(0, 200)) {
      const cleanedUrl = cleanUrl(art.url);

      const category = categorizeArticle(art); // 🔥 MAIN FIX

      const doc = {
        title: art.title,
        description: art.description,
        content: art.content || art.description,
        url: cleanedUrl,
        image: art.urlToImage,
        category,
        publishedAt: art.publishedAt || new Date(),
      };

      const result = await Article.findOneAndUpdate(
        { title: art.title }, // Strictly match title to stop duplicate news across sources
        doc,
        { upsert: true, new: true }
      );

      if (result) savedCount++;
    }

    console.log("💾 Saved:", savedCount);

    res.json({
      success: true,
      fetched: articles.length,
      unique: uniqueArticles.length,
      saved: savedCount,
    });

  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Get Articles by Category
router.get("/category/:type", async (req, res) => {
  try {
    const type = req.params.type;

    const articles = await Article.find({
      category: new RegExp(`^${type}$`, "i"),
    })
      .sort({ publishedAt: -1 })
      .limit(20);

    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: "Error fetching category news" });
  }
});

// 🔹 Get Recent Articles
router.get("/recent", async (req, res) => {
  try {
    const articles = await Article.find()
      .sort({ publishedAt: -1 })
      .limit(20);

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

module.exports = router;