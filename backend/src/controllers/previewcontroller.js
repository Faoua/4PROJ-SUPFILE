// backend/src/controllers/previewController.js

const { File } = require('../models');
const path = require('path');
const fs = require('fs');

// Obtenir les informations de prévisualisation d'un fichier
const getPreviewInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({
      where: { id, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Déterminer le type de prévisualisation
    const previewTypes = {
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'application/pdf': 'pdf',
      'text/plain': 'text',
      'text/html': 'text',
      'text/css': 'text',
      'text/javascript': 'text',
      'application/json': 'text',
      'video/mp4': 'video',
      'video/webm': 'video',
      'audio/mpeg': 'audio',
      'audio/wav': 'audio'
    };

    const previewType = previewTypes[file.mimeType] || 'none';

    res.json({
      success: true,
      data: {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        previewType,
        canPreview: previewType !== 'none'
      }
    });
  } catch (error) {
    console.error('Erreur getPreviewInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des informations de prévisualisation'
    });
  }
};

// Obtenir la prévisualisation d'un fichier
const getPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const file = await File.findOne({
      where: { id, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    const filePath = file.path;

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier physique non trouvé'
      });
    }

    // Définir le content-type approprié
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);

    // Streamer le fichier
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Erreur getPreview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prévisualisation du fichier'
    });
  }
};

module.exports = {
  getPreviewInfo,
  getPreview
};