const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Activity = require('../models/Activity');
const Article = require('../models/Article');

async function migrate() {
  await connectDB();
  console.log('Migrating like counts...');

  // Group activities by articleId
  const likeCounts = await Activity.aggregate([
    { $match: { actionType: 'like' } },
    { $group: { _id: '$articleId', count: { $sum: 1 } } }
  ]);

  // Update articles
  for (let doc of likeCounts) {
    await Article.findByIdAndUpdate(doc._id, { 
      $set: { likeCount: doc.count || 0 } 
    });
    console.log(`Updated ${doc._id}: ${doc.count} likes`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);

