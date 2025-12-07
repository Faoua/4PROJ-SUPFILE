const { File, Folder } = require('../models');
const { Op } = require('sequelize');

// Fichiers récents
exports.getRecentFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const files = await File.findAll({
      where: { userId, isDeleted: false },
      order: [['updatedAt', 'DESC']],
      limit
    });

    const folders = await Folder.findAll({
      where: { userId, isDeleted: false },
      order: [['updatedAt', 'DESC']],
      limit
    });

    res.json({
      success: true,
      files,
      folders
    });
  } catch (error) {
    console.error('Erreur getRecentFiles:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Fichiers favoris
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const files = await File.findAll({
      where: { userId, isDeleted: false, isFavorite: true },
      order: [['updatedAt', 'DESC']]
    });

    const folders = await Folder.findAll({
      where: { userId, isDeleted: false, isFavorite: true },
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      files,
      folders
    });
  } catch (error) {
    console.error('Erreur getFavorites:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Toggle favori fichier
exports.toggleFileFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false }
    });

    if (!file) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }

    file.isFavorite = !file.isFavorite;
    await file.save();

    res.json({
      success: true,
      message: file.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris',
      file
    });
  } catch (error) {
    console.error('Erreur toggleFileFavorite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// Toggle favori dossier
exports.toggleFolderFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Dossier non trouvé' });
    }

    folder.isFavorite = !folder.isFavorite;
    await folder.save();

    res.json({
      success: true,
      message: folder.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris',
      folder
    });
  } catch (error) {
    console.error('Erreur toggleFolderFavorite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};