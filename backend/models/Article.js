const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  content: { type: String, default: "" },
  url: { type: String, required: true, unique: true, trim: true },
  image: { type: String, default: "" },

  // ✅ Dynamic category (NO ENUM)
  category: { type: String, required: true },

  publishedAt: { type: Date, default: Date.now },
  likeCount: { type: Number, default: 0 }
}, { timestamps: true });

articleSchema.index({ category: 1 });
articleSchema.index({ publishedAt: -1 });

module.exports = mongoose.model("Article", articleSchema);