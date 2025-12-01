const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Modèle User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true  // Nullable pour OAuth2
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false
  },
  storageQuota: {
    type: DataTypes.BIGINT,
    defaultValue: 30 * 1024 * 1024 * 1024, // 30 Go
    allowNull: false
  },
  // Champs OAuth2
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  githubId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Méthode pour comparer les mots de passe
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ne pas retourner le mot de passe dans les réponses JSON
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = { User, sequelize };