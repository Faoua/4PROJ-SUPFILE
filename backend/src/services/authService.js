const User = require('../models/User');
const JWTUtil = require('../utils/jwt');
const ValidationUtil = require('../utils/validation');

class AuthService {
  static async register(email, password, name) {
    // Validation
    email = ValidationUtil.sanitizeEmail(email);
    
    if (!ValidationUtil.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!ValidationUtil.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and numbers');
    }

    if (!ValidationUtil.validateName(name)) {
      throw new Error('Name must be between 2 and 100 characters');
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Créer l'utilisateur
    const user = await User.create(email, password, name);
    const token = JWTUtil.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    };
  }

  static async login(email, password) {
    email = ValidationUtil.sanitizeEmail(email);

    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const passwordMatch = await User.verifyPassword(password, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    const token = JWTUtil.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    };
  }

  static async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordMatch = await User.verifyPassword(oldPassword, user.password);
    if (!passwordMatch) {
      throw new Error('Invalid password');
    }

    if (!ValidationUtil.validatePassword(newPassword)) {
      throw new Error('New password must be at least 8 characters with uppercase, lowercase, and numbers');
    }

    await User.updatePassword(userId, newPassword);
    return { message: 'Password updated successfully' };
  }

  static async getUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}

module.exports = AuthService;