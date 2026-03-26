const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
callbackURL: '/auth/google/callback', // Full: http://localhost:5000/auth/google/callback for local
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        } else {
          // If not, create a new user
          const newUser = {
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            languagePreference: 'English',
            interests: []
          };
          user = await User.create(newUser);
          return done(null, user);
        }
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  )
);

// We don't necessarily need serializeUser/deserializeUser if we are strictly using JWT,
// but passport might require it for the callback flow depending on the setup. 
// We are going to issue a JWT and use stateless session, so we won't use session logic.
