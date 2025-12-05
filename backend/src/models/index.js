const { User } = require('./user');    
const { File } = require('./file');    
const { Folder } = require('./folder');
  

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

// Folder <-> Folders  
Folder.hasMany(Folder, {
  foreignKey: 'parentId',
  as: 'subfolders',
  onDelete: 'CASCADE'
});
Folder.belongsTo(Folder, {
  foreignKey: 'parentId',
  as: 'parent'
});

module.exports = {
  User,
  File,
  Folder
};