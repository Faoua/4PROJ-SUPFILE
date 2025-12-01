const { Folder, File, User } = require('../models/index');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { Op } = require('sequelize');

//  
// CRÉER UN DOSSIER
//  

exports.createFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, parentId } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nom du dossier requis'
      });
    }

    // Vérifier que le parent existe (si spécifié)
    if (parentId) {
      const parent = await Folder.findOne({
        where: { id: parentId, userId, isDeleted: false }
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Dossier parent non trouvé'
        });
      }
    }

    // Vérifier qu'un dossier avec ce nom n'existe pas déjà au même endroit
    const existing = await Folder.findOne({
      where: {
        name,
        parentId: parentId || null,
        userId,
        isDeleted: false
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un dossier avec ce nom existe déjà à cet emplacement'
      });
    }

    // Créer le dossier
    const folder = await Folder.create({
      name,
      parentId: parentId || null,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Dossier créé avec succès',
      folder
    });
  } catch (error) {
    console.error('Erreur createFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du dossier'
    });
  }
};

//  
// LISTER LES DOSSIERS
//  

exports.getFolders = async (req, res) => {
  try {
    const userId = req.user.id;
    const parentId = req.query.parentId || null;
    const includeDeleted = req.query.includeDeleted === 'true';

    const whereClause = {
      userId,
      parentId: parentId,
      isDeleted: includeDeleted ? undefined : false
    };

    const folders = await Folder.findAll({
      where: whereClause,
      include: [
        {
          model: Folder,
          as: 'subfolders',
          where: { isDeleted: false },
          required: false,
          attributes: ['id', 'name']
        },
        {
          model: File,
          as: 'files',
          where: { isDeleted: false },
          required: false,
          attributes: ['id', 'name', 'size', 'mimeType']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: folders.length,
      folders
    });
  } catch (error) {
    console.error('Erreur getFolders:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des dossiers'
    });
  }
};

//  
// OBTENIR UN DOSSIER SPÉCIFIQUE
//  

exports.getFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false },
      include: [
        {
          model: Folder,
          as: 'subfolders',
          where: { isDeleted: false },
          required: false
        },
        {
          model: File,
          as: 'files',
          where: { isDeleted: false },
          required: false
        },
        {
          model: Folder,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Erreur getFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du dossier'
    });
  }
};

//  
// RENOMMER UN DOSSIER
//  

exports.renameFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau nom requis'
      });
    }

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier qu'un dossier avec ce nom n'existe pas déjà au même endroit
    const existing = await Folder.findOne({
      where: {
        name: newName,
        parentId: folder.parentId,
        userId,
        isDeleted: false,
        id: { [Op.ne]: folderId }
      }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un dossier avec ce nom existe déjà à cet emplacement'
      });
    }

    folder.name = newName;
    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Dossier renommé avec succès',
      folder
    });
  } catch (error) {
    console.error('Erreur renameFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renommage du dossier'
    });
  }
};

//  
// DÉPLACER UN DOSSIER
//  

exports.moveFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;
    const { newParentId } = req.body;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Vérifier que le nouveau parent existe (si spécifié)
    if (newParentId) {
      const parent = await Folder.findOne({
        where: { id: newParentId, userId, isDeleted: false }
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Dossier de destination non trouvé'
        });
      }

      // Vérifier qu'on ne déplace pas un dossier dans lui-même ou ses sous-dossiers
      if (newParentId === folderId) {
        return res.status(400).json({
          success: false,
          message: 'Impossible de déplacer un dossier dans lui-même'
        });
      }

      // Vérifier récursivement qu'on ne crée pas une boucle
      let checkParent = parent;
      while (checkParent) {
        if (checkParent.id === folderId) {
          return res.status(400).json({
            success: false,
            message: 'Impossible de déplacer un dossier dans un de ses sous-dossiers'
          });
        }
        if (!checkParent.parentId) break;
        checkParent = await Folder.findByPk(checkParent.parentId);
      }
    }

    folder.parentId = newParentId || null;
    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Dossier déplacé avec succès',
      folder
    });
  } catch (error) {
    console.error('Erreur moveFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du déplacement du dossier'
    });
  }
};

//  
// SUPPRIMER UN DOSSIER (SOFT DELETE)
//  

exports.deleteFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Fonction récursive pour supprimer tous les sous-dossiers et fichiers
    const deleteFolderRecursive = async (folderId) => {
      // Supprimer les fichiers du dossier
      await File.update(
        { isDeleted: true, deletedAt: new Date() },
        { where: { folderId, isDeleted: false } }
      );

      // Supprimer les sous-dossiers
      const subfolders = await Folder.findAll({
        where: { parentId: folderId, isDeleted: false }
      });

      for (const subfolder of subfolders) {
        await deleteFolderRecursive(subfolder.id);
        subfolder.isDeleted = true;
        subfolder.deletedAt = new Date();
        await subfolder.save();
      }
    };

    await deleteFolderRecursive(folderId);

    folder.isDeleted = true;
    folder.deletedAt = new Date();
    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Dossier et son contenu déplacés vers la corbeille'
    });
  } catch (error) {
    console.error('Erreur deleteFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du dossier'
    });
  }
};

//  
// RESTAURER UN DOSSIER
//  

exports.restoreFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: true }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé dans la corbeille'
      });
    }

    // Restaurer récursivement
    const restoreFolderRecursive = async (folderId) => {
      // Restaurer les fichiers
      await File.update(
        { isDeleted: false, deletedAt: null },
        { where: { folderId, isDeleted: true } }
      );

      // Restaurer les sous-dossiers
      const subfolders = await Folder.findAll({
        where: { parentId: folderId, isDeleted: true }
      });

      for (const subfolder of subfolders) {
        subfolder.isDeleted = false;
        subfolder.deletedAt = null;
        await subfolder.save();
        await restoreFolderRecursive(subfolder.id);
      }
    };

    await restoreFolderRecursive(folderId);

    folder.isDeleted = false;
    folder.deletedAt = null;
    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Dossier et son contenu restaurés avec succès',
      folder
    });
  } catch (error) {
    console.error('Erreur restoreFolder:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la restauration du dossier'
    });
  }
};

 // TÉLÉCHARGER UN DOSSIER EN ZIP
 
exports.downloadFolderAsZip = async (req, res) => {
  try {
    const userId = req.user.id;
    const folderId = req.params.id;

    const folder = await Folder.findOne({
      where: { id: folderId, userId, isDeleted: false }
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Dossier non trouvé'
      });
    }

    // Configurer les headers pour le téléchargement
    const zipFileName = `${folder.name}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

    // Créer l'archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Niveau de compression maximum
    });

    // Gérer les erreurs
    archive.on('error', (err) => {
      console.error('Erreur archivage:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création de l\'archive'
        });
      }
    });

    // Envoyer l'archive au client
    archive.pipe(res);

    // Fonction récursive pour ajouter les fichiers et sous-dossiers à l'archive
    const addFolderToArchive = async (folderId, basePath = '') => {
      // Ajouter les fichiers du dossier
      const files = await File.findAll({
        where: { folderId, isDeleted: false }
      });

      for (const file of files) {
        try {
          const filePath = path.join(basePath, file.originalName);
          archive.file(file.path, { name: filePath });
        } catch (err) {
          console.error('Erreur ajout fichier à l\'archive:', err);
        }
      }

      // Ajouter les sous-dossiers
      const subfolders = await Folder.findAll({
        where: { parentId: folderId, isDeleted: false }
      });

      for (const subfolder of subfolders) {
        const subfolderPath = path.join(basePath, subfolder.name);
        await addFolderToArchive(subfolder.id, subfolderPath);
      }
    };

    // Ajouter tout le contenu
    await addFolderToArchive(folderId, folder.name);

    // Finaliser l'archive
    await archive.finalize();
  } catch (error) {
    console.error('Erreur downloadFolderAsZip:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du téléchargement du dossier'
      });
    }
  }
};