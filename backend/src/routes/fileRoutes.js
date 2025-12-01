const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { validateStorage } = require('../middleware/validateStorage');

// Toutes les routes sont protégées
router.use(protect);

//  
// ROUTES FICHIERS
//  

// Upload de fichiers (multiple)
router.post(
  '/upload',
  upload.array('files', 10), // Max 10 fichiers
  validateStorage,
  fileController.uploadFiles
);

// Lister les fichiers
router.get('/', fileController.getFiles);

// Télécharger un fichier
router.get('/:id/download', fileController.downloadFile);

// Renommer un fichier
router.patch('/:id/rename', fileController.renameFile);

// Déplacer un fichier
router.patch('/:id/move', fileController.moveFile);

// Supprimer un fichier (soft delete)
router.delete('/:id', fileController.deleteFile);

// Restaurer un fichier
router.patch('/:id/restore', fileController.restoreFile);

// Supprimer définitivement un fichier
router.delete('/:id/permanent', fileController.permanentDeleteFile);

// Vider la corbeille
router.delete('/trash/empty', fileController.emptyTrash);

module.exports = router;