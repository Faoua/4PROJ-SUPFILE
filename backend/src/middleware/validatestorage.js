const { User } = require('../models/User');

// Middleware pour vérifier le quota de stockage avant upload
const validateStorage = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Calculer la taille totale des fichiers uploadés
    let totalSize = 0;
    
    if (req.files) {
      // Upload multiple
      totalSize = req.files.reduce((sum, file) => sum + file.size, 0);
    } else if (req.file) {
      // Upload simple
      totalSize = req.file.size;
    }

    // Vérifier le quota
    const newStorageUsed = user.storageUsed + totalSize;
    
    if (newStorageUsed > user.storageQuota) {
      return res.status(413).json({
        success: false,
        message: 'Quota de stockage dépassé',
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        requiredSpace: totalSize,
        availableSpace: user.storageQuota - user.storageUsed
      });
    }

    // Passer au prochain middleware
    next();
  } catch (error) {
    console.error('Erreur validation storage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du quota'
    });
  }
};

module.exports = { validateStorage };