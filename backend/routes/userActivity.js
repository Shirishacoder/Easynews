const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Activity = require("../models/Activity");
const Article = require("../models/Article");
const { protect } = require("../middleware/auth");
const mongoose = require('mongoose');

// Track read (view)
router.post("/read", protect, async (req, res) => {
  const articleId = req.body.articleId;
  const userId = req.user._id || req.body.userId;
  const { title, description, image, url } = req.body;

  // ✅ Validation
  if (!articleId) {
    return res.status(400).json({ error: "Missing article ID" });
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ error: "Invalid article ID" });
  }
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(`[Activity Track] User ${userId} viewed article ${articleId}`);

  try {
    // ✅ Ensure Article exists (for populate/counts)
    let article = await Article.findById(articleId);
    if (!article) {
      console.log("⚠️ Article not found, creating stub");
      article = await Article.create({
        _id: articleId,
        title: title || "Unknown",
        description: description || "",
        image: image || "",
        url: url || "",
        category: "general",
        likeCount: 0
      });
    }

    // ✅ Upsert Activity with snapshot
    await Activity.findOneAndUpdate(
      { userId, articleId, actionType: 'view' },
      {
        userId,
        articleId,
        actionType: 'view',
        articleSnapshot: {
          title: title || "",
          description: description || "",
          image: image || "",
          url: url || ""
        }
      },
      { upsert: true,returnDocument: "after"}
    );

    // Sync User readHistory
    await User.findByIdAndUpdate(userId, {
      $addToSet: { readHistory: articleId }
    });

    // Optional: Inc viewCount if added to Article schema
    // await Article.findByIdAndUpdate(articleId, { $inc: { viewCount: 1 } });

    res.json({ message: "View tracked" });
  } catch (error) {
    console.error('❌ READ ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/like", protect, async (req, res) => {
  console.log('=== LIKE ENDPOINT HIT ===');
  console.log('req.body:', req.body);
  console.log('req.user:', req.user?._id);

  const articleId = req.body.articleId;
  const userId = req.user?._id || req.body.userId; // fallback
  const actionType = 'like';

  // ✅ Validation
  if (!articleId) {
    console.log('❌ MISSING articleId');
    return res.status(400).json({ error: "Missing article ID" });
  }

  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    console.log('❌ INVALID articleId:', articleId);
    return res.status(400).json({ error: "Invalid article ID" });
  }

  if (!userId) {
    console.log('❌ NO USER ID');
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(`[Activity Track] User ${userId} like toggle for article ${articleId}`);

  try {
    // ✅ Check existing like
    const existing = await Activity.findOne({ userId, articleId, actionType });
    console.log('Existing activity:', existing ? 'FOUND' : 'NOT FOUND');

    // ✅ Ensure article exists
    let article = await Article.findById(articleId);

    if (!article) {
      console.log("⚠️ Article not found, creating new one");

      article = await Article.create({
        _id: articleId,
        likeCount: 0
      });
    }

    if (existing) {
      // 🔻 UNLIKE
      console.log('🗑️ Deleting existing like');

      await Activity.findByIdAndDelete(existing._id);

      await User.findByIdAndUpdate(userId, {
        $pull: { likedArticles: articleId }
      });

      // Prevent negative count
      await Article.findByIdAndUpdate(articleId, {
        $inc: { likeCount: -1 }
      });

      console.log('✅ Like removed');

      return res.json({ liked: false });

    } else {
      // 🔺 LIKE
      console.log('➕ Creating new like');

     const { title, description, image, url } = req.body;

const newActivity = await Activity.create({
  userId,
  articleId,
  actionType,

  // 🔥 ADD THIS
  articleSnapshot: {
    title,
    description,
    image,
    url
  }
});

      console.log('New activity created:', newActivity._id);

      await User.findByIdAndUpdate(userId, {
        $addToSet: { likedArticles: articleId }
      });

      await Article.findByIdAndUpdate(articleId, {
        $inc: { likeCount: 1 }
      });

      console.log('✅ Like added');

      return res.json({ liked: true });
    }

  } catch (error) {
    console.error('❌ LIKE ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/save", protect, async (req, res) => {
  const { articleId, title, description, image, url } = req.body;
  const userId = req.user._id || req.body.userId;
  const actionType = 'save';

  // ✅ Validation
  if (!articleId) {
    return res.status(400).json({ error: "Missing article ID" });
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ error: "Invalid article ID" });
  }
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(`[Activity Track] User ${userId} save toggle for article ${articleId}`);

  try {
    // ✅ Ensure Article exists
    let article = await Article.findById(articleId);
    if (!article) {
      console.log("⚠️ Article not found, creating stub");
      article = await Article.create({
        _id: articleId,
        title: title || "Unknown",
        description: description || "",
        image: image || "",
        url: url || "",
        category: "general"
      });
    }

    const existing = await Activity.findOne({ userId, articleId, actionType });

    if (existing) {
      // 🔻 REMOVE SAVE
      await Activity.findByIdAndDelete(existing._id);
      await User.findByIdAndUpdate(userId, {
        $pull: { savedArticles: articleId }
      });
      return res.json({ saved: false, message: "Save removed" });
    } else {
      // 🔺 ADD SAVE
      await Activity.create({
        userId,
        articleId,
        actionType,
        articleSnapshot: {
          title: title || "",
          description: description || "",
          image: image || "",
          url: url || ""
        }
      });
      await User.findByIdAndUpdate(userId, {
        $addToSet: { savedArticles: articleId }
      });
      return res.json({ saved: true, message: "Save added" });
    }
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/dislike", protect, async (req, res) => {
  const { articleId, title, description, image, url } = req.body;
  const userId = req.user._id || req.body.userId;
  const actionType = "dislike";

  // ✅ Validation
  if (!articleId) {
    return res.status(400).json({ error: "Missing article ID" });
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ error: "Invalid article ID" });
  }
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(`[Activity Track] User ${userId} dislike toggle for article ${articleId}`);

  try {
    // ✅ Ensure Article exists
    let article = await Article.findById(articleId);
    if (!article) {
      console.log("⚠️ Article not found, creating stub");
      article = await Article.create({
        _id: articleId,
        title: title || "Unknown",
        description: description || "",
        image: image || "",
        url: url || "",
        category: "general",
        likeCount: 0
      });
    }

    // 🔥 REMOVE LIKE IF EXISTS (sync count)
    const existingLike = await Activity.findOne({ userId, articleId, actionType: "like" });
    if (existingLike) {
      await Activity.findByIdAndDelete(existingLike._id);
      await Article.findByIdAndUpdate(articleId, { $inc: { likeCount: -1 } });
      console.log("⚠️ Removed conflicting like");
    }

    // Toggle dislike
    const existingDislike = await Activity.findOne({ userId, articleId, actionType });
    if (existingDislike) {
      // 🔻 REMOVE
      await Activity.findByIdAndDelete(existingDislike._id);
      return res.json({ disliked: false, message: "Dislike removed" });
    } else {
      // 🔺 ADD
      await Activity.create({
        userId,
        articleId,
        actionType,
        articleSnapshot: {
          title: title || "",
          description: description || "",
          image: image || "",
          url: url || ""
        }
      });
      return res.json({ disliked: true, message: "Dislike added" });
    }
  } catch (error) {
    console.error("❌ DISLIKE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user liked article
router.get("/like/:articleId/status", protect, async (req, res) => {
  const articleId = req.params.articleId;
  const userId = req.user._id;
  
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ liked: false });
  }

  const activity = await Activity.findOne({
    userId, 
    articleId, 
    actionType: 'like'
  });

  res.json({ liked: !!activity });
});

router.get("/like/:articleId/count", async (req, res) => {
  const articleId = req.params.articleId;

  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ count: 0 });
  }

  try {
    const count = await Activity.countDocuments({
      articleId,
      actionType: "like"
    });

    res.json({ count });
  } catch (error) {
    console.error("Count error:", error);
    res.status(500).json({ count: 0 });
  }
});

// Track comment
router.post("/comment", protect, async (req, res) => {
  const { articleId, commentText, title, description, image, url } = req.body;
  const userId = req.user._id || req.body.userId;

  // ✅ Validation
  if (!commentText?.trim()) {
    return res.status(400).json({ message: "Comment text required" });
  }
  if (!articleId || !mongoose.Types.ObjectId.isValid(articleId)) {
    return res.status(400).json({ message: "Invalid article ID" });
  }
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  console.log(`[Activity Track] User ${userId} commented on ${articleId}: "${commentText.slice(0,50)}..."`);

  try {
    // ✅ Ensure Article exists
    let article = await Article.findById(articleId);
    if (!article) {
      console.log("⚠️ Article not found for comment, creating stub");
      article = await Article.create({
        _id: articleId,
        title: title || "Unknown Article",
        description: description || "",
        image: image || "",
        url: url || "",
        category: "general"
      });
    }

    // ✅ Create comment (no toggle, always new)
    const newComment = await Activity.create({
      userId,
      articleId,
      actionType: "comment",
      commentText: commentText.trim(),
      articleSnapshot: {
        title: title || "",
        description: description || "",
        image: image || "",
        url: url || ""
      }
    });

    res.json({ message: "Comment added", comment: newComment });
  } catch (error) {
    console.error("❌ COMMENT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET user activities (support ?type=like&page=1&limit=10)
router.get('/:userId', protect, async (req, res) => {
  const paramUserId = req.params.userId;
  const userId = req.user._id;
  if (paramUserId !== userId.toString()) {
    return res.status(403).json({ message: "Access denied" });
  }
  const { type } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { userId };
  if (type) query.actionType = type;

  const activities = await Activity.find(query)
    .populate('articleId', 'title description image category url publishedAt content likeCount')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json(activities);
});

router.get("/article/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    res.json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE activity
router.delete('/:id', protect, async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity || activity.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: "Activity not found" });
  }
  await Activity.findByIdAndDelete(req.params.id);
  res.json({ message: "Activity deleted" });
});

module.exports = router;
