const natural = require("natural");
const TfIdf = natural.TfIdf;

// 🔹 Dedup helper (based on URL)
const deduplicate = (articles) => {
  const map = new Map();

  articles.forEach((a) => {
    if (a.url && !map.has(a.url)) {
      map.set(a.url, a);
    }
  });

  return Array.from(map.values());
};

const getMLRecommendations = async (allArticles, user, page = 1, limit = 10) => {
  const tfidf = new TfIdf();
  const Activity = require('../models/Activity');

  // ✅ Step 1: Add all articles to TF-IDF
  allArticles.forEach((article) => {
    const text = (article.title || "") + " " + (article.description || "");
    tfidf.addDocument(text);
  });

  let queryParts = [];

  // ✅ Get recent activities (limit 50 for perf)
  const activities = await Activity.find({ userId: user._id })
    .populate('articleId', 'title description')
    .sort({ timestamp: -1 })
    .limit(50);

  // ✅ Read History (x1)
  const readActs = activities
  .filter(a => a.actionType === 'view' && a.articleId)
  .map(a => a.articleId);
  readActs.forEach((a) => {
    queryParts.push((a.title || "") + " " + (a.description || ""));
  });

const likedActs = activities
  .filter(a => a.actionType === 'like' && a.articleId)
  .map(a => a.articleId);
  likedActs.forEach((a) => {
    const text = (a.title || "") + " " + (a.description || "");
    queryParts.push(text, text);
  });

const savedActs = activities
  .filter(a => a.actionType === 'save' && a.articleId)
  .map(a => a.articleId);
  savedActs.forEach((a) => {
    const text = (a.title || "") + " " + (a.description || "");
    queryParts.push(text, text, text);
  });

  const queryText = queryParts.join(" ");
  const skip = (page - 1) * limit;

  // 🔥 Cold Start (no history)
  if (!queryText.trim()) {
    const unique = deduplicate(allArticles);
    return unique.slice(skip, skip + limit);
  }

  // ✅ Step 2: Calculate TF-IDF scores
  let scores = [];

  tfidf.tfidfs(queryText, (i, measure) => {
    scores.push({
      index: i,
      score: measure,
    });
  });

  // Sort by relevance
  scores.sort((a, b) => b.score - a.score);

  let rankedArticles = scores.map((item) => allArticles[item.index]);

  // 🔥 STEP 3: Deduplicate after ranking
  rankedArticles = deduplicate(rankedArticles);

  // 🔥 STEP 4: Remove already seen articles
  const seenUrls = new Set([
    ...readActs.map(a => a.url || ''),
    ...likedActs.map(a => a.url || ''),
    ...savedActs.map(a => a.url || ''),
  ]);

  rankedArticles = rankedArticles.filter(a => !seenUrls.has(a.url));

  // 🔥 OPTIONAL: Fallback if too few articles
  if (rankedArticles.length < limit) {
    const fallback = allArticles.filter(a => !seenUrls.has(a.url));
    rankedArticles = [...rankedArticles, ...fallback];
    rankedArticles = deduplicate(rankedArticles);
  }

  // ✅ Step 5: Hybrid Recommendation (80/20)
  const userInterests = user.interests || [];

  const interestMatched = rankedArticles.filter((article) =>
    userInterests.includes(article.category)
  );

  const exploration = rankedArticles.filter(
    (article) => !userInterests.includes(article.category)
  );

  let hybridList = [];
  let mIndex = 0;
  let eIndex = 0;

  while (mIndex < interestMatched.length || eIndex < exploration.length) {
    // 4 interest-based
    for (let i = 0; i < 4 && mIndex < interestMatched.length; i++) {
      hybridList.push(interestMatched[mIndex++]);
    }
    // 1 exploration
    if (eIndex < exploration.length) {
      hybridList.push(exploration[eIndex++]);
    }
  }

  // 🔥 STEP 6: Final dedup after hybrid
  hybridList = deduplicate(hybridList);

  // 🔥 STEP 7: Pagination AFTER everything
  return hybridList.slice(skip, skip + limit);
};

module.exports = { getMLRecommendations };