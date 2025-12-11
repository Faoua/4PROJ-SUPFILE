const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

 router.get('/:token', shareController.accessShare);
router.get('/:token/download', shareController.downloadShare);

module.exports = router;