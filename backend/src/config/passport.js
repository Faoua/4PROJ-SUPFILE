const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { User } = require('../models/user');

// Sérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Désérialisation de l'utilisateur
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// STRATÉGIE GOOGLE
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Chercher un utilisateur avec cet ID Google
          let user = await User.findOne({ where: { googleId: profile.id } });

          if (user) {
            // Utilisateur existe déjà avec Google
            return done(null, user);
          }

          // Vérifier si l'email existe déjà
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (email) {
            user = await User.findOne({ where: { email } });
            
            if (user) {
              // L'email existe, on associe le compte Google
              user.googleId = profile.id;
              user.profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
              await user.save();
              return done(null, user);
            }
          }

          // Créer un nouveau compte
          user = await User.create({
            googleId: profile.id,
            email: email,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            isEmailVerified: true
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

// STRATÉGIE GITHUB
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`,
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Chercher un utilisateur avec cet ID GitHub
          let user = await User.findOne({ where: { githubId: profile.id } });

          if (user) {
            return done(null, user);
          }

          // Récupérer l'email (GitHub peut avoir plusieurs emails)
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

          if (email) {
            user = await User.findOne({ where: { email } });
            
            if (user) {
              user.githubId = profile.id;
              user.profilePicture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
              await user.save();
              return done(null, user);
            }
          }

          // Créer un nouveau compte
          const displayName = profile.displayName || profile.username;
          const nameParts = displayName ? displayName.split(' ') : ['', ''];
          
          user = await User.create({
            githubId: profile.id,
            email: email,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            isEmailVerified: true
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;