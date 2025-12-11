// backend/src/controllers/shareController.js

const { File, Folder, Share, User } = require('../models');
const crypto = require('crypto');
const { Op } = require('sequelize');

// Générer un token unique pour le partage
const generateShareToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Créer un partage de fichier
const createFileShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { expiresAt, password, permissions = 'read' } = req.body;

    const file = await File.findOne({
      where: { id, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    const shareToken = generateShareToken();
    
    const share = await Share.create({
      shareToken,
      fileId: file.id,
      folderId: null,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      password: password || null
    });

    res.status(201).json({
      success: true,
      message: 'Lien de partage créé',
      data: {
        id: share.id,
        token: share.shareToken,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`,
        expiresAt: share.expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur createFileShare:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du partage'
    });
  }
};

// Obtenir les partages d'un fichier
const getFileShares = async (req, res) => {
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

    const shares = await Share.findAll({
      where: { fileId: id, userId }
    });

    res.json({
      success: true,
      data: shares.map(share => ({
        id: share.id,
        token: share.shareToken,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt
      }))
    });
  } catch (error) {
    console.error('Erreur getFileShares:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des partages'
    });
  }
};

// Créer un partage de dossier
const createFolderShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { expiresAt, password, permissions = 'read' } = req.body;

    const folder = await Folder.findOne({
      where: { id, userId }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    const shareToken = generateShareToken();
    
    const share = await Share.create({
      shareToken,
      fileId: null,
      folderId: folder.id,
      userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      password: password || null
    });

    res.status(201).json({
      success: true,
      message: 'Lien de partage créé',
      data: {
        id: share.id,
        token: share.shareToken,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`,
        expiresAt: share.expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur createFolderShare:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du partage'
    });
  }
};

// Obtenir les partages d'un dossier
const getFolderShares = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const folder = await Folder.findOne({
      where: { id, userId }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    const shares = await Share.findAll({
      where: { folderId: id, userId }
    });

    res.json({
      success: true,
      data: shares.map(share => ({
        id: share.id,
        token: share.shareToken,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${share.shareToken}`,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt
      }))
    });
  } catch (error) {
    console.error('Erreur getFolderShares:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des partages'
    });
  }
};

// Accéder à un partage public
const accessShare = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const share = await Share.findOne({
      where: { shareToken: token },
    include: [
  { model: File, as: 'File' },
  { model: Folder, as: 'Folder' }
]
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Lien de partage invalide ou expiré'
      });
    }

    // Vérifier l'expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Ce lien de partage a expiré'
      });
    }

    // Vérifier le mot de passe si nécessaire
    if (share.password && share.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe requis ou incorrect',
        requiresPassword: true
      });
    }

    // Incrémenter le compteur de téléchargements (utilisé comme compteur de vues)
    await share.increment('downloadCount');

    if (share.fileId && share.File) {
      res.json({
        success: true,
        data: {
          type: 'file',
          name: share.File.name,
          size: share.File.size,
          mimeType: share.File.mimeType
        }
      });
    } else if (share.folderId && share.Folder) {
      // Récupérer le contenu du dossier
      const files = await File.findAll({
        where: { folderId: share.Folder.id }
      });
      const subfolders = await Folder.findAll({
        where: { parentId: share.Folder.id }
      });

      res.json({
        success: true,
        data: {
          type: 'folder',
          name: share.Folder.name,
          contents: {
            files: files.map(f => ({
              id: f.id,
              name: f.name,
              size: f.size,
              mimeType: f.mimeType
            })),
            folders: subfolders.map(f => ({
              id: f.id,
              name: f.name
            }))
          }
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Contenu partagé non trouvé'
      });
    }
  } catch (error) {
    console.error('Erreur accessShare:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'accès au partage'
    });
  }
};

// Télécharger depuis un partage public
const downloadShare = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, fileId } = req.query;
    const fs = require('fs');

    const share = await Share.findOne({
      where: { shareToken: token },
   include: [
  { model: File, as: 'File' },
  { model: Folder, as: 'Folder' }
]
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Lien de partage invalide'
      });
    }

    // Vérifier l'expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      return res.status(410).json({
        success: false,
        message: 'Ce lien de partage a expiré'
      });
    }

    // Vérifier le mot de passe
    if (share.password && share.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe requis ou incorrect'
      });
    }

    let fileToDownload;

    if (share.fileId) {
      fileToDownload = share.File;
    } else if (share.folderId && fileId) {
      fileToDownload = await File.findOne({
        where: { id: fileId, folderId: share.Folder.id }
      });
    }

    if (!fileToDownload) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    if (!fs.existsSync(fileToDownload.path)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier physique non trouvé'
      });
    }

    await share.increment('downloadCount');

    res.setHeader('Content-Type', fileToDownload.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileToDownload.name}"`);
    res.setHeader('Content-Length', fileToDownload.size);

    const fileStream = fs.createReadStream(fileToDownload.path);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Erreur downloadShare:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement'
    });
  }
};

// Supprimer un partage
const deleteShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const share = await Share.findOne({
      where: { id, userId }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Partage non trouvé'
      });
    }

    await share.destroy();

    res.json({
      success: true,
      message: 'Partage supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteShare:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du partage'
    });
  }
};

module.exports = {
  createFileShare,
  getFileShares,
  createFolderShare,
  getFolderShares,
  accessShare,
  downloadShare,
  deleteShare
};