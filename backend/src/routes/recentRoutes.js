const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const recentController = require('../controllers/recentController');

router.get('/recent', protect, recentController.getRecentFiles);
router.get('/favorites', protect, recentController.getFavorites);
router.patch('/files/:id/favorite', protect, recentController.toggleFileFavorite);
router.patch('/folders/:id/favorite', protect, recentController.toggleFolderFavorite);

module.exports = router;