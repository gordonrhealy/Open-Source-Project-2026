// Passport OAuth Configuration - Google & GitHub
// Finova Backend - Munster, Ireland

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = (passport) => {
  // JWT Strategy for API authentication
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'finova-secret-key-cork-ireland-2026'
  };

  passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  }));

  // Google OAuth 2.0 Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Google ID
        let user = await User.findOne({
          'oauthProviders.provider': 'google',
          'oauthProviders.providerId': profile.id
        });

        if (user) {
          // Update tokens
          const providerIndex = user.oauthProviders.findIndex(
            p => p.provider === 'google' && p.providerId === profile.id
          );
          
          if (providerIndex !== -1) {
            user.oauthProviders[providerIndex].accessToken = accessToken;
            user.oauthProviders[providerIndex].refreshToken = refreshToken;
            user.lastLogin = Date.now();
            await user.save();
          }

          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        
        if (email) {
          user = await User.findOne({ email });
          
          if (user) {
            // Link Google account to existing user
            await user.addOAuthProvider({
              provider: 'google',
              providerId: profile.id,
              email,
              displayName: profile.displayName,
              profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
              accessToken,
              refreshToken
            });

            return done(null, user);
          }
        }

        // Create new user
        const newUser = new User({
          username: profile.displayName.replace(/\s/g, '_').toLowerCase() + '_' + Date.now(),
          email: email || `google_${profile.id}@placeholder.com`,
          profile: {
            firstName: profile.name ? profile.name.givenName : '',
            lastName: profile.name ? profile.name.familyName : '',
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null
          },
          oauthProviders: [{
            provider: 'google',
            providerId: profile.id,
            email,
            displayName: profile.displayName,
            profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            accessToken,
            refreshToken,
            connectedAt: Date.now()
          }],
          verified: true, // Trust OAuth providers
          lastLogin: Date.now()
        });

        await newUser.save();
        return done(null, newUser);

      } catch (error) {
        console.error('Google OAuth Error:', error);
        return done(error, null);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
      scope: ['user:email'],
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this GitHub ID
        let user = await User.findOne({
          'oauthProviders.provider': 'github',
          'oauthProviders.providerId': profile.id
        });

        if (user) {
          // Update tokens
          const providerIndex = user.oauthProviders.findIndex(
            p => p.provider === 'github' && p.providerId === profile.id
          );
          
          if (providerIndex !== -1) {
            user.oauthProviders[providerIndex].accessToken = accessToken;
            user.oauthProviders[providerIndex].refreshToken = refreshToken;
            user.lastLogin = Date.now();
            await user.save();
          }

          return done(null, user);
        }

        // Get primary email
        const email = profile.emails && profile.emails.length > 0 
          ? profile.emails.find(e => e.primary)?.value || profile.emails[0].value
          : null;

        if (email) {
          user = await User.findOne({ email });
          
          if (user) {
            // Link GitHub account to existing user
            await user.addOAuthProvider({
              provider: 'github',
              providerId: profile.id,
              email,
              displayName: profile.displayName || profile.username,
              profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
              accessToken,
              refreshToken
            });

            return done(null, user);
          }
        }

        // Create new user
        const newUser = new User({
          username: profile.username || profile.displayName.replace(/\s/g, '_').toLowerCase() + '_' + Date.now(),
          email: email || `github_${profile.id}@placeholder.com`,
          profile: {
            firstName: profile.displayName ? profile.displayName.split(' ')[0] : profile.username,
            lastName: profile.displayName ? profile.displayName.split(' ').slice(1).join(' ') : '',
            avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            bio: profile._json.bio || ''
          },
          oauthProviders: [{
            provider: 'github',
            providerId: profile.id,
            email,
            displayName: profile.displayName || profile.username,
            profilePhoto: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
            accessToken,
            refreshToken,
            connectedAt: Date.now()
          }],
          verified: true,
          lastLogin: Date.now()
        });

        await newUser.save();
        return done(null, newUser);

      } catch (error) {
        console.error('GitHub OAuth Error:', error);
        return done(error, null);
      }
    }));
  }

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
