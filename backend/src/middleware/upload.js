const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Créer le dossier uploads s'il n'existe pas
const uploadDir = '/app/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Créer un dossier par utilisateur
    const userDir = path.join(uploadDir, req.user.id);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp + random
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    cb(null, sanitizedName + '-' + uniqueSuffix + ext);
  }
});

 const fileFilter = (req, file, cb) => {
  // Liste des types MIME interdits (exécutables, scripts dangereux)
  const forbiddenTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-sh',
    'application/x-executable'
  ];
  
  if (forbiddenTypes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorisé pour des raisons de sécurité'), false);
  }
  
  cb(null, true);
};

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5 Go par fichier
    files: 10 // Max 10 fichiers simultanés
  }
});

module.exports = upload;