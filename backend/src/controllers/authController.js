const jwt = require('jsonwebtoken');
const { User } = require('../models/index');

// Générer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'votre_secret_changez_moi_en_production',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// AUTHENTIFICATION DE BASE

// Inscription
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName
    });

    // Générer le token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// CALLBACKS OAUTH2

// Callback Google
exports.googleCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    const token = generateToken(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('Erreur Google callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// Callback GitHub
exports.githubCallback = (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }

    const token = generateToken(req.user.id);
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('Erreur GitHub callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
  }
};

// GESTION DU PROFIL

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si le nouvel email existe déjà
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
      
      user.email = email;
      user.isEmailVerified = false;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// Changer le mot de passe
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez d\'abord définir un mot de passe. Votre compte utilise uniquement OAuth2.'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};

// Définir un mot de passe (pour comptes OAuth)
exports.setPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.password) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un mot de passe. Utilisez /change-password'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mot de passe défini avec succès'
    });
  } catch (error) {
    console.error('Erreur setPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la définition du mot de passe'
    });
  }
};

// ==========================================
// GESTION DES COMPTES OAUTH LIÉS
// ==========================================

// Lier un compte Google
exports.linkGoogle = async (req, res) => {
  try {
    const userId = req.user.id;
    const googleId = req.account.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const existingUser = await User.findOne({ where: { googleId } });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: 'Ce compte Google est déjà lié à un autre utilisateur'
      });
    }

    user.googleId = googleId;
    if (req.account.photos && req.account.photos[0]) {
      user.profilePicture = req.account.photos[0].value;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Compte Google lié avec succès',
      user: {
        id: user.id,
        email: user.email,
        googleId: user.googleId,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Erreur linkGoogle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la liaison du compte Google'
    });
  }
};

// Délier un compte Google
exports.unlinkGoogle = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Aucun compte Google lié'
      });
    }

    if (!user.password && !user.githubId) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez avoir au moins un moyen de connexion (mot de passe ou GitHub)'
      });
    }

    user.googleId = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Compte Google délié avec succès'
    });
  } catch (error) {
    console.error('Erreur unlinkGoogle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du lien Google'
    });
  }
};

// Lier un compte GitHub
exports.linkGitHub = async (req, res) => {
  try {
    const userId = req.user.id;
    const githubId = req.account.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const existingUser = await User.findOne({ where: { githubId } });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: 'Ce compte GitHub est déjà lié à un autre utilisateur'
      });
    }

    user.githubId = githubId;
    if (req.account.photos && req.account.photos[0]) {
      user.profilePicture = req.account.photos[0].value;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Compte GitHub lié avec succès',
      user: {
        id: user.id,
        email: user.email,
        githubId: user.githubId,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Erreur linkGitHub:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la liaison du compte GitHub'
    });
  }
};

// Délier un compte GitHub
exports.unlinkGitHub = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.githubId) {
      return res.status(400).json({
        success: false,
        message: 'Aucun compte GitHub lié'
      });
    }

    if (!user.password && !user.googleId) {
      return res.status(400).json({
        success: false,
        message: 'Vous devez avoir au moins un moyen de connexion (mot de passe ou Google)'
      });
    }

    user.githubId = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Compte GitHub délié avec succès'
    });
  } catch (error) {
    console.error('Erreur unlinkGitHub:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du lien GitHub'
    });
  }
};

// Obtenir les comptes liés
exports.getLinkedAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      linkedAccounts: {
        hasPassword: !!user.password,
        google: {
          linked: !!user.googleId,
          id: user.googleId
        },
        github: {
          linked: !!user.githubId,
          id: user.githubId
        }
      }
    });
  } catch (error) {
    console.error('Erreur getLinkedAccounts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des comptes liés'
    });
  }

};
