const { File, Folder, User } = require('../models/index');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { Op } = require('sequelize');

 // UPLOAD DE FICHIERS
 
exports.uploadFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.body.folderId || null;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    // Vérifier que le dossier existe (si spécifié)
    if (folderId) {
      const folder = await Folder.findOne({
        where: { id: folderId, userId, isDeleted: false }
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Dossier non trouvé'
        });
      }
    }

    // Créer les entrées en base de données
    const uploadedFiles = [];
    let totalSize = 0;

    for (const file of files) {
      const fileEntry = await File.create({
        name: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        folderId: folderId,
        userId: userId
      });

      uploadedFiles.push(fileEntry);
      totalSize += file.size;
    }

    // Mettre à jour le stockage utilisé
    const user = await User.findByPk(userId);
    user.storageUsed += totalSize;
    await user.save();

    res.status(201).json({
      success: true,
      message: `${files.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles,
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des fichiers'
    });
  }
};

 // LISTER LES FICHIERS
 
exports.getFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.query.folderId || null;
    const includeDeleted = req.query.includeDeleted === 'true';
    
    const whereClause = {
      userId,
      folderId: folderId
    };
    
    
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }
    
    const files = await File.findAll({
      where: whereClause,
      include: [
        {
          model: Folder,
          as: 'folder',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Récupérer le stockage utilisé
    const user = await User.findByPk(userId);

    res.status(200).json({
      success: true,
      count: files.length,
      files,
      storageUsed: user.storageUsed || 0,
      storageQuota: user.storageQuota || 30 * 1024 * 1024 * 1024
    });
  } catch (error) {
    console.error('Erreur getFiles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des fichiers'
    });
  }
};

//  
// TÉLÉCHARGER UN FICHIER
 
exports.downloadFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier que le fichier existe sur le disque
    try {
      await fs.access(file.path);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Fichier physique introuvable'
      });
    }

    // Envoyer le fichier
    res.download(file.path, file.originalName, (err) => {
      if (err) {
        console.error('Erreur téléchargement:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Erreur lors du téléchargement'
          });
        }
      }
    });
  } catch (error) {
    console.error('Erreur downloadFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du téléchargement du fichier'
    });
  }
};

 // RENOMMER UN FICHIER
 
exports.renameFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau nom requis'
      });
    }

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    file.originalName = newName;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Fichier renommé avec succès',
      file
    });
  } catch (error) {
    console.error('Erreur renameFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renommage du fichier'
    });
  }
};

 // DÉPLACER UN FICHIER
 
exports.moveFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;
    const { folderId } = req.body;

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier que le nouveau dossier existe (si spécifié)
    if (folderId) {
      const folder = await Folder.findOne({
        where: { id: folderId, userId, isDeleted: false }
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Dossier de destination non trouvé'
        });
      }
    }

    file.folderId = folderId || null;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Fichier déplacé avec succès',
      file
    });
  } catch (error) {
    console.error('Erreur moveFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du déplacement du fichier'
    });
  }
};

 // SUPPRIMER UN FICHIER  
 
exports.deleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: false }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Suppression soft (corbeille)
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Fichier déplacé vers la corbeille'
    });
  } catch (error) {
    console.error('Erreur deleteFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fichier'
    });
  }
};

 // RESTAURER UN FICHIER
 
exports.restoreFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId, isDeleted: true }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé dans la corbeille'
      });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.status(200).json({
      success: true,
      message: 'Fichier restauré avec succès',
      file
    });
  } catch (error) {
    console.error('Erreur restoreFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration du fichier'
    });
  }
};

 // SUPPRIMER DÉFINITIVEMENT UN FICHIER
 
exports.permanentDeleteFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Supprimer le fichier physique
    try {
      await fs.unlink(file.path);
    } catch (err) {
      console.error('Erreur suppression fichier physique:', err);
    }

    // Mettre à jour le stockage utilisé
    const user = await User.findByPk(userId);
    user.storageUsed = Math.max(0, user.storageUsed - file.size);
    await user.save();

    // Supprimer l'entrée en base
    await file.destroy();

    res.status(200).json({
      success: true,
      message: 'Fichier supprimé définitivement',
      storageUsed: user.storageUsed,
      storageQuota: user.storageQuota
    });
  } catch (error) {
    console.error('Erreur permanentDeleteFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression définitive du fichier'
    });
  }
};

 // VIDER LA CORBEILLE
 
exports.emptyTrash = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer tous les fichiers supprimés
    const deletedFiles = await File.findAll({
      where: { userId, isDeleted: true }
    });

    let totalFreed = 0;

    // Supprimer chaque fichier physiquement
    for (const file of deletedFiles) {
      try {
        await fs.unlink(file.path);
        totalFreed += file.size;
      } catch (err) {
        console.error('Erreur suppression fichier:', err);
      }
      
      await file.destroy();
    }

    // Mettre à jour le stockage
    const user = await User.findByPk(userId);
    user.storageUsed = Math.max(0, user.storageUsed - totalFreed);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Corbeille vidée',
      filesDeleted: deletedFiles.length,
      spaceFreed: totalFreed,
      storageUsed: user.storageUsed
    });
  } catch (error) {
    console.error('Erreur emptyTrash:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du vidage de la corbeille'
    });
  }
};


// LISTER LA CORBEILLE
exports.getTrash = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const files = await File.findAll({
      where: { userId, isDeleted: true },
      order: [['deletedAt', 'DESC']]
    });

    const folders = await Folder.findAll({
      where: { userId, isDeleted: true },
      order: [['deletedAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      files,
      folders
    });
  } catch (error) {
    console.error('Erreur getTrash:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la corbeille'
    });
  }
};

// PREVIEW INFO
exports.getPreviewInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    const mimeType = file.mimeType || '';
    let previewType = null;
    let canPreview = false;

    if (mimeType.startsWith('image/')) {
      previewType = 'image';
      canPreview = true;
    } else if (mimeType.startsWith('video/')) {
      previewType = 'video';
      canPreview = true;
    } else if (mimeType.startsWith('audio/')) {
      previewType = 'audio';
      canPreview = true;
    } else if (mimeType === 'application/pdf') {
      previewType = 'pdf';
      canPreview = true;
    } else if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/javascript' ||
      mimeType === 'application/xml'
    ) {
      previewType = 'text';
      canPreview = true;
    }

    res.json({
      success: true,
      canPreview,
      previewType,
      mimeType,
      fileName: file.originalName || file.name,
      size: file.size
    });
  } catch (error) {
    console.error('Erreur getPreviewInfo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des infos'
    });
  }
};

// PREVIEW FICHIER
exports.previewFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = req.params.id;

    const file = await File.findOne({
      where: { id: fileId, userId }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

    // Vérifier que le fichier existe
    try {
      await fs.access(file.path);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'Fichier physique non trouvé'
      });
    }

    const mimeType = file.mimeType || '';

    // Pour les fichiers texte, renvoyer le contenu brut
    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/javascript' ||
      mimeType === 'application/xml'
    ) {
      const content = await fs.readFile(file.path, 'utf-8');
      return res.type('text/plain').send(content);
    }

    // Pour les autres types, streamer le fichier
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', file.size);
    
    const fsSync = require('fs');
    const stream = fsSync.createReadStream(file.path);
    stream.pipe(res);
  } catch (error) {
    console.error('Erreur previewFile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la prévisualisation'
    });
  }
};