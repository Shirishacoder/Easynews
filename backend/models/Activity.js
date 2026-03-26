const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },

  // 🔥 ADD THIS (VERY IMPORTANT)
  articleSnapshot: {
    title: String,
    description: String,
    image: String,
    url: String
  },

  actionType: {
    type: String,
    required: true,
    enum: ['like', 'dislike', 'save', 'comment', 'view']
  },

  commentText: {
    type: String,
    trim: true,
    default: ''
  },

  timestamp: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });


// 🔒 Prevent duplicate actions
activitySchema.index({ userId: 1, articleId: 1, actionType: 1 }, { unique: true });

// ⚡ Performance
activitySchema.index({ userId: 1, actionType: 1 });
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ articleId: 1 });

module.exports = mongoose.model("Activity", activitySchema);