// backend/src/routes/featuresRoutes.js

const express = require('express');
const router = express.Router();
const previewController = require('../controllers/previewController');
const shareController = require('../controllers/shareController');
const searchController = require('../controllers/searchController');
const { protect: auth } = require('../middleware/authMiddleware');

// Preview routes
router.get('/files/:id/preview-info', auth, previewController.getPreviewInfo);
router.get('/files/:id/preview', auth, previewController.getPreview);   
// File share routes
router.post('/files/:id/share', auth, shareController.createFileShare);
router.get('/files/:id/shares', auth, shareController.getFileShares);

// Folder share routes
router.post('/folders/:id/share', auth, shareController.createFolderShare);
router.get('/folders/:id/shares', auth, shareController.getFolderShares);

// Public share access (no auth required)
router.get('/share/:token', shareController.accessShare);   
router.get('/share/:token/download', shareController.downloadShare);   

// Share management
router.delete('/shares/:id', auth, shareController.deleteShare);

// Search routes
router.get('/search', auth, searchController.search);
router.post('/search/advanced', auth, searchController.advancedSearch);


module.exports = router;
