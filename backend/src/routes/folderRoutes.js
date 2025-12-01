const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

// Toutes les routes sont protégées
router.use(protect);

 // ROUTES DOSSIERS
//  

// Créer un dossier
router.post('/', folderController.createFolder);

// Lister les dossiers
router.get('/', folderController.getFolders);

// Obtenir un dossier spécifique (avec son contenu)
router.get('/:id', folderController.getFolder);

// Renommer un dossier
router.patch('/:id/rename', folderController.renameFolder);

// Déplacer un dossier
router.patch('/:id/move', folderController.moveFolder);

// Supprimer un dossier (soft delete)
router.delete('/:id', folderController.deleteFolder);

// Restaurer un dossier
router.patch('/:id/restore', folderController.restoreFolder);

// Télécharger un dossier en ZIP
router.get('/:id/download', folderController.downloadFolderAsZip);

module.exports = router;