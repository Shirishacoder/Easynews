require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const connectDB = require('./config/db');
const newsRoutes = require("./routes/news");
const recommendRoutes = require("./routes/recommend");
const activityRoutes = require("./routes/userActivity");
const aiRoutes = require("./routes/ai");
const storyArcRoutes = require("./routes/storyArc");


// Connect to database
connectDB();

// Passport config
require('./config/passport');

const app = express();


app.use(express.static("public"));
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use("/api/story-arc", storyArcRoutes); 
app.use("/api/news", newsRoutes);
app.use("/api/recommend", recommendRoutes);
// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'easynews_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/activity", activityRoutes);
app.use("/api/ai", aiRoutes);

// Routes
const authRouter = require('./routes/authRoutes');
app.use('/auth', authRouter);
const userRouter = require('./routes/userRoutes');
app.use('/user', userRouter);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
