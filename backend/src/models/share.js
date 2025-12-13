const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Share = sequelize.define('Share', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shareToken: {
    type: DataTypes.STRING(64), 
    allowNull: false,
    unique: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  fileId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  folderId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  maxDownloads: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'shares'
});


module.exports = Share;
