const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    // Not required because users using Google OAuth won't have a password
    required: false
  },
  googleId: {
    type: String,
    // Not required because normal users won't have this
    required: false,
    sparse: true // allows multiple nulls
  },
  languagePreference: {
    type: String,
    default: 'English'
  },
  interests: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
likedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
savedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // example: hashing
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
