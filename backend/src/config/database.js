const { Sequelize } = require('sequelize');

// Configuration de la connexion à la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME || 'supfile',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'supfile_password',
  {
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

// Tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Connexion à la base de données réussie');
    return true;
  } catch (error) {
    console.error(' Impossible de se connecter à la base de données:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };