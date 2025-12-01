require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const { sequelize, testConnection } = require('./src/config/database');
const passport = require('./src/config/passport');

const app = express();

// Middlewares de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (nécessaire pour Passport)
app.use(session({
  secret: process.env.JWT_SECRET || 'votre_secret_changez_moi_en_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SUPFile Backend API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'connected',
    oauth: {
      google: !!process.env.GOOGLE_CLIENT_ID,
      github: !!process.env.GITHUB_CLIENT_ID
    }
  });
});

// Routes API
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API fonctionnelle avec base de données et OAuth2',
    version: '1.0.0'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connexion à la base de données et démarrage du serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Impossible de démarrer le serveur sans base de données');
      process.exit(1);
    }

    // Synchroniser les modèles avec la base de données
    await sequelize.sync({ alter: true });
    console.log('Modèles synchronisés avec la base de données');

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('SUPFile Backend Started!');
      console.log('========================================');
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Port: ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`Auth: http://localhost:${PORT}/api/auth`);
      console.log('');
      console.log('OAuth2 Providers:');
      console.log(`  Google: ${process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Disabled'}`);
      console.log(`  GitHub: ${process.env.GITHUB_CLIENT_ID ? 'Enabled' : 'Disabled'}`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;