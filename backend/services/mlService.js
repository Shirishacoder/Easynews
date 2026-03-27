const natural = require("natural");
const TfIdf = natural.TfIdf;

// 🔹 Deduplicate helper
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

  // ✅ Step 1: Add articles to TF-IDF
  allArticles.forEach((article) => {
    const text = (article.title || "") + " " + (article.description || "");
    tfidf.addDocument(text);
  });

  let queryParts = [];

  // ✅ Step 2: Get user activities
  const activities = await Activity.find({ userId: user._id })
    .populate('articleId', '_id title description url category')
    .sort({ timestamp: -1 })
    .limit(50);

  const readActs = activities
    .filter(a => a.actionType === 'view' && a.articleId)
    .map(a => a.articleId);

  const likedActs = activities
    .filter(a => a.actionType === 'like' && a.articleId)
    .map(a => a.articleId);

  const savedActs = activities
    .filter(a => a.actionType === 'save' && a.articleId)
    .map(a => a.articleId);

  // 🔥 Build query (weighted)
  readActs.forEach(a => {
    queryParts.push(a.title + " " + a.description);
  });

  likedActs.forEach(a => {
    const t = a.title + " " + a.description;
    queryParts.push(t, t);
  });

  savedActs.forEach(a => {
    const t = a.title + " " + a.description;
    queryParts.push(t, t, t);
  });

  // 🔥 Add user interests + profession
  const userInterests = user.interests || [];
  const profession = user.profession || "";

  userInterests.forEach(i => queryParts.push(i, i));
  if (profession) queryParts.push(profession, profession, profession);

  const queryText = queryParts.join(" ");
  const skip = (page - 1) * limit;

  // 🔥 Cold start
  if (!queryText.trim()) {
    let latest = [...allArticles].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );

    return latest.slice(skip, skip + limit);
  }

  // ✅ Step 3: TF-IDF + Recency
  let scores = [];

  tfidf.tfidfs(queryText, (i, measure) => {
    const article = allArticles[i];

    const hoursOld =
      (Date.now() - new Date(article.publishedAt)) / (1000 * 60 * 60);

    const recencyScore = Math.max(0, 1 - hoursOld / 24);

    const finalScore =
      (0.7 * measure) +
      (0.3 * recencyScore);

    scores.push({
      index: i,
      score: finalScore,
    });
  });

  // 🔹 Sort by relevance
  scores.sort((a, b) => b.score - a.score);

  let rankedArticles = scores.map((item) => allArticles[item.index]);

  // 🔹 Deduplicate
  rankedArticles = deduplicate(rankedArticles);

  // 🔥 Step 4: REMOVE viewed + liked articles
  const seenIds = new Set([
    ...readActs.map(a => a._id.toString()),
    ...likedActs.map(a => a._id.toString()),
  ]);

  rankedArticles = rankedArticles.filter(
    a => !seenIds.has(a._id.toString())
  );

  // 🔥 Step 5: Hybrid recommendation
  const interestMatched = rankedArticles.filter((article) =>
    userInterests.includes(article.category)
  );

  const exploration = rankedArticles.filter(
    (article) => !userInterests.includes(article.category)
  );

  let hybridList = [];
  let m = 0, e = 0;

  while (m < interestMatched.length || e < exploration.length) {
    for (let i = 0; i < 4 && m < interestMatched.length; i++) {
      hybridList.push(interestMatched[m++]);
    }
    if (e < exploration.length) {
      hybridList.push(exploration[e++]);
    }
  }

  hybridList = deduplicate(hybridList);

  // 🔥 Step 6: FINAL FILTER again (important)
  hybridList = hybridList.filter(
    a => !seenIds.has(a._id.toString())
  );

  // 🔥 Step 7: SHUFFLE (NEW ORDER EVERY REFRESH 🚀)
  for (let i = hybridList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hybridList[i], hybridList[j]] = [hybridList[j], hybridList[i]];
  }

  // 🔥 Step 8: Pagination
  return hybridList.slice(skip, skip + limit);
};

module.exports = { getMLRecommendations };