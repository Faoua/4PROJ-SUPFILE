const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

 // ROUTES TRADITIONNELLES
 
// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes protégées
router.get('/me', protect, authController.getMe);

 // ROUTES OAUTH2 - GOOGLE
 
// Initier l'authentification Google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// Callback Google
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false 
  }),
  authController.googleCallback
);

 // ROUTES OAUTH2 - GITHUB
 
// Initier l'authentification GitHub
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false 
  })
);

// Callback GitHub
router.get('/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_auth_failed`,
    session: false 
  }),
  authController.githubCallback
);

 

module.exports = router;