  const { sequelize } = require('../config/database');
  const { DataTypes } = require('sequelize');

  // Modèle Folder
  const Folder = sequelize.define('Folder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Folders',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Chemin complet du dossier (ex: /Documents/Photos)'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Couleur du dossier pour l\'interface'
    }
  }, {
    timestamps: true,
    paranoid: false
  });

  module.exports = { Folder };