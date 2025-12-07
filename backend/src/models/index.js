const { User } = require('./user');    
const { File } = require('./file');    
const { Folder } = require('./folder');
const Share = require('./share');   
  
// User <-> Files (1:N)
User.hasMany(File, {
  foreignKey: 'userId',
  as: 'files',
  onDelete: 'CASCADE'
});
File.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// User <-> Folders (1:N)
User.hasMany(Folder, {
  foreignKey: 'userId',
  as: 'folders',
  onDelete: 'CASCADE'
});
Folder.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// Folder <-> Files (1:N)
Folder.hasMany(File, {
  foreignKey: 'folderId',
  as: 'files',
  onDelete: 'SET NULL'
});
File.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'folder'
});

// Folder <-> Folders (auto-référence)
Folder.hasMany(Folder, {
  foreignKey: 'parentId',
  as: 'subfolders',
  onDelete: 'CASCADE'
});
Folder.belongsTo(Folder, {
  foreignKey: 'parentId',
  as: 'parent'
});

// User <-> Shares (1:N)
User.hasMany(Share, {
  foreignKey: 'userId',
  as: 'shares',
  onDelete: 'CASCADE'
});
Share.belongsTo(User, {
  foreignKey: 'userId',
  as: 'User'
});

// File <-> Shares (1:N)
File.hasMany(Share, {
  foreignKey: 'fileId',
  as: 'shares',
  onDelete: 'CASCADE'
});
Share.belongsTo(File, {
  foreignKey: 'fileId',
  as: 'File'
});

// Folder <-> Shares (1:N)
Folder.hasMany(Share, {
  foreignKey: 'folderId',
  as: 'shares',
  onDelete: 'CASCADE'
});
Share.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'Folder'
});

module.exports = {
  User,
  File,
  Folder,
  Share
};