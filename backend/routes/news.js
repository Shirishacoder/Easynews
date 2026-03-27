const express = require("express");
const router = express.Router();
const fetchNews = require("../services/newsService");
const Article = require("../models/Article");

// 🔹 Clean URL
const cleanUrl = (url) => (url ? url.split("?")[0] : "");
const stringSimilarity = require("string-similarity");

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
    const articles = await fetchNews();

    console.log("📰 Total fetched:", articles.length);

    const seenUrls = new Set();
    const uniqueArticles = [];

    // 👉 store titles for similarity check
    const existingArticles = await Article.find({}, "title");
    const existingTitles = existingArticles.map(a => a.title.toLowerCase());

   for (let art of articles) {
  const url = cleanUrl(art.url);
  const title = art.title?.trim().toLowerCase();

  if (!url || !title || title === "[removed]") continue;

  if (seenUrls.has(url)) continue;

  const isDuplicate = existingTitles.some(existingTitle => {
    return stringSimilarity.compareTwoStrings(title, existingTitle) > 0.7;
  });

  if (isDuplicate) continue;

  // ✅ ADD THIS LINE (MAIN FIX)
  existingTitles.push(title);

  seenUrls.add(url);
  uniqueArticles.push(art);
}

    console.log("✨ Unique articles:", uniqueArticles.length);

    let savedCount = 0;

    for (let art of uniqueArticles.slice(0, 200)) {
      const cleanedUrl = cleanUrl(art.url);
      const category = categorizeArticle(art);

      const doc = {
        title: art.title,
        description: art.description,
        content: art.content || art.description,
        url: cleanedUrl,
        image: art.urlToImage,
        category,
        publishedAt: art.publishedAt || new Date(),
      };

      // ✅ FIX: use URL for DB uniqueness
      await Article.updateOne(
        { url: cleanedUrl },
        { $set: doc },
        { upsert: true }
      );

      savedCount++;
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
    let articles = await Article.find();

    // 🆕 Sort by latest
    articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 🔥 Shuffle top 10 for variation
    const top = articles.slice(0, 10);
    const rest = articles.slice(10);

    for (let i = top.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top[i], top[j]] = [top[j], top[i]];
    }

    const final = [...top, ...rest];

    res.json(final.slice(0, 20));

  } catch (err) {
    res.status(500).json({ error: "DB error" });
  }
});

module.exports = router;