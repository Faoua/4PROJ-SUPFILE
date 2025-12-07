// backend/src/controllers/searchController.js

const { File, Folder } = require('../models');
const { Op } = require('sequelize');

// Recherche simple
const search = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, type, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Le paramètre de recherche "q" est requis'
      });
    }

    const searchTerm = `%${q.trim()}%`;
    const results = { files: [], folders: [] };

    // Rechercher dans les fichiers
    if (!type || type === 'file' || type === 'all') {
      const files = await File.findAll({
        where: {
          userId,
          isDeleted: false,
          [Op.or]: [
            { name: { [Op.like]: searchTerm } },
            { originalName: { [Op.like]: searchTerm } }
          ]
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']]
      });

      results.files = files.map(file => ({
        id: file.id,
        name: file.name,
        type: 'file',
        mimeType: file.mimeType,
        size: file.size,
        folderId: file.folderId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));
    }

    // Rechercher dans les dossiers
    if (!type || type === 'folder' || type === 'all') {
      const folders = await Folder.findAll({
        where: {
          userId,
          isDeleted: false,
          name: { [Op.like]: searchTerm }
        },
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']]
      });

      results.folders = folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }));
    }

    res.json({
      success: true,
      query: q,
      files: results.files,
      folders: results.folders,
      total: results.files.length + results.folders.length
    });
  } catch (error) {
    console.error('Erreur search:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche'
    });
  }
};

// Recherche avancée
const advancedSearch = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      query,
      type,
      mimeType,
      minSize,
      maxSize,
      createdAfter,
      createdBefore,
      modifiedAfter,
      modifiedBefore,
      folderId,
      limit = 20,
      offset = 0
    } = req.body;

    const results = { files: [], folders: [] };

    // Construire les conditions pour les fichiers
    if (!type || type === 'file' || type === 'all') {
      const fileWhere = { userId };

      if (query) {
        fileWhere.name = { [Op.like]: `%${query}%` };
      }

      if (mimeType) {
        if (mimeType === 'image') {
          fileWhere.mimeType = { [Op.like]: 'image/%' };
        } else if (mimeType === 'video') {
          fileWhere.mimeType = { [Op.like]: 'video/%' };
        } else if (mimeType === 'audio') {
          fileWhere.mimeType = { [Op.like]: 'audio/%' };
        } else if (mimeType === 'document') {
          fileWhere.mimeType = {
            [Op.or]: [
              { [Op.like]: 'application/pdf' },
              { [Op.like]: 'application/msword' },
              { [Op.like]: 'application/vnd.openxmlformats%' },
              { [Op.like]: 'text/%' }
            ]
          };
        } else {
          fileWhere.mimeType = mimeType;
        }
      }

      if (minSize) {
        fileWhere.size = { ...fileWhere.size, [Op.gte]: parseInt(minSize) };
      }

      if (maxSize) {
        fileWhere.size = { ...fileWhere.size, [Op.lte]: parseInt(maxSize) };
      }

      if (createdAfter) {
        fileWhere.createdAt = { ...fileWhere.createdAt, [Op.gte]: new Date(createdAfter) };
      }

      if (createdBefore) {
        fileWhere.createdAt = { ...fileWhere.createdAt, [Op.lte]: new Date(createdBefore) };
      }

      if (modifiedAfter) {
        fileWhere.updatedAt = { ...fileWhere.updatedAt, [Op.gte]: new Date(modifiedAfter) };
      }

      if (modifiedBefore) {
        fileWhere.updatedAt = { ...fileWhere.updatedAt, [Op.lte]: new Date(modifiedBefore) };
      }

      if (folderId) {
        fileWhere.folderId = folderId === 'root' ? null : folderId;
      }

      const files = await File.findAll({
        where: fileWhere,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']]
      });

      results.files = files.map(file => ({
        id: file.id,
        name: file.name,
        type: 'file',
        mimeType: file.mimeType,
        size: file.size,
        folderId: file.folderId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));
    }

    // Construire les conditions pour les dossiers
    if (!type || type === 'folder' || type === 'all') {
      const folderWhere = { userId };

      if (query) {
        folderWhere.name = { [Op.like]: `%${query}%` };
      }

      if (createdAfter) {
        folderWhere.createdAt = { ...folderWhere.createdAt, [Op.gte]: new Date(createdAfter) };
      }

      if (createdBefore) {
        folderWhere.createdAt = { ...folderWhere.createdAt, [Op.lte]: new Date(createdBefore) };
      }

      if (modifiedAfter) {
        folderWhere.updatedAt = { ...folderWhere.updatedAt, [Op.gte]: new Date(modifiedAfter) };
      }

      if (modifiedBefore) {
        folderWhere.updatedAt = { ...folderWhere.updatedAt, [Op.lte]: new Date(modifiedBefore) };
      }

      if (folderId) {
        folderWhere.parentId = folderId === 'root' ? null : folderId;
      }

      const folders = await Folder.findAll({
        where: folderWhere,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['updatedAt', 'DESC']]
      });

      results.folders = folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }));
    }

    res.json({
      success: true,
      filters: req.body,
      data: results,
      total: results.files.length + results.folders.length
    });
  } catch (error) {
    console.error('Erreur advancedSearch:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche avancée'
    });
  }
};

module.exports = {
  search,
  advancedSearch
};
 