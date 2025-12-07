import { Folder, File, Image, Film, Music, FileText, MoreVertical, Download, Trash2, Edit, Share2, Eye } from 'lucide-react';
import { useState } from 'react';

const FileGrid = ({ files, folders, loading, view, onFolderClick, onFilePreview, onDelete, onRename, onDownload, onShare }) => {
  const [menuOpen, setMenuOpen] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [newName, setNewName] = useState('');

  const getFileIcon = (mimeType) => {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
    return File;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleRename = (type, id) => {
    if (newName.trim()) {
      onRename(type, id, newName);
    }
    setRenaming(null);
    setNewName('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Folder className="w-16 h-16 mb-4 opacity-50" />
        <p>Aucun fichier ou dossier</p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="bg-slate-800/30 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Nom</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Taille</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Modifié</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {folders.map((folder) => (
              <tr key={`folder-${folder.id}`} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onFolderClick(folder.id, folder.name)}
                    className="flex items-center gap-3 text-white hover:text-indigo-400"
                  >
                    <Folder className="w-5 h-5 text-indigo-400" />
                    {renaming === `folder-${folder.id}` ? (
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleRename('folder', folder.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename('folder', folder.id)}
                        className="bg-slate-700 px-2 py-1 rounded text-white"
                        autoFocus
                      />
                    ) : (
                      <span>{folder.name}</span>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-400">—</td>
                <td className="px-4 py-3 text-slate-400">{formatDate(folder.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <ItemMenu
                    type="folder"
                    item={folder}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onRename={() => { setRenaming(`folder-${folder.id}`); setNewName(folder.name); }}
                    onDelete={() => onDelete('folder', folder.id)}
                    onShare={() => onShare({ type: 'folder', ...folder })}
                  />
                </td>
              </tr>
            ))}
            {files.map((file) => {
              const IconComponent = getFileIcon(file.mimeType);
              return (
                <tr key={`file-${file.id}`} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-slate-400" />
                      {renaming === `file-${file.id}` ? (
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={() => handleRename('file', file.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename('file', file.id)}
                          className="bg-slate-700 px-2 py-1 rounded text-white"
                          autoFocus
                        />
                      ) : (
                        <span className="text-white">{file.originalName || file.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatSize(file.size)}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(file.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <ItemMenu
                      type="file"
                      item={file}
                      menuOpen={menuOpen}
                      setMenuOpen={setMenuOpen}
                      onPreview={() => onFilePreview(file)}
                      onDownload={() => onDownload(file)}
                      onRename={() => { setRenaming(`file-${file.id}`); setNewName(file.originalName || file.name); }}
                      onDelete={() => onDelete('file', file.id)}
                      onShare={() => onShare({ type: 'file', ...file })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {folders.map((folder) => (
        <div
          key={`folder-${folder.id}`}
          className="group relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/50 hover:bg-slate-700/50 transition-all cursor-pointer"
        >
          <button
            onClick={() => onFolderClick(folder.id, folder.name)}
            className="w-full text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-3">
              <Folder className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-white font-medium truncate">{folder.name}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDate(folder.updatedAt)}</p>
          </button>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ItemMenu
              type="folder"
              item={folder}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              onRename={() => { setRenaming(`folder-${folder.id}`); setNewName(folder.name); }}
              onDelete={() => onDelete('folder', folder.id)}
              onShare={() => onShare({ type: 'folder', ...folder })}
            />
          </div>
        </div>
      ))}

      {files.map((file) => {
        const IconComponent = getFileIcon(file.mimeType);
        return (
          <div
            key={`file-${file.id}`}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-indigo-500/50 hover:bg-slate-700/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-3">
              <IconComponent className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-white font-medium truncate">{file.originalName || file.name}</p>
            <p className="text-xs text-slate-400 mt-1">{formatSize(file.size)}</p>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ItemMenu
                type="file"
                item={file}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onPreview={() => onFilePreview(file)}
                onDownload={() => onDownload(file)}
                onRename={() => { setRenaming(`file-${file.id}`); setNewName(file.originalName || file.name); }}
                onDelete={() => onDelete('file', file.id)}
                onShare={() => onShare({ type: 'file', ...file })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ItemMenu = ({ type, item, menuOpen, setMenuOpen, onPreview, onDownload, onRename, onDelete, onShare }) => {
  const id = `${type}-${item.id}`;
  const isOpen = menuOpen === id;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(isOpen ? null : id); }}
        className="p-1 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
          <div className="absolute right-0 top-8 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-2">
            {type === 'file' && onPreview && (
              <button
                onClick={() => { onPreview(); setMenuOpen(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Eye className="w-4 h-4" />
                Aperçu
              </button>
            )}
            {type === 'file' && onDownload && (
              <button
                onClick={() => { onDownload(); setMenuOpen(null); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            )}
            <button
              onClick={() => { onShare(); setMenuOpen(null); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
            <button
              onClick={() => { onRename(); setMenuOpen(null); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              <Edit className="w-4 h-4" />
              Renommer
            </button>
            <button
              onClick={() => { onDelete(); setMenuOpen(null); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileGrid;