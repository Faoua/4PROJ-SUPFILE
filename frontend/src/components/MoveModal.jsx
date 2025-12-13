import { useState, useEffect } from 'react';
import { X, Folder, ChevronRight, Home } from 'lucide-react';
import API from '../api/axios';

const MoveModal = ({ isOpen, onClose, item, onMove }) => {
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Mes fichiers' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders(null);
      setBreadcrumb([{ id: null, name: 'Mes fichiers' }]);
    }
  }, [isOpen]);

  const loadFolders = async (parentId) => {
    setLoading(true);
    try {
      const response = await API.get('/folders', {
        params: { parentId: parentId || '' }
      });
      // Filtrer le dossier qu'on déplace (si c'est un dossier)
      let folderList = response.data.folders || [];
      if (item?.type === 'folder') {
        folderList = folderList.filter(f => f.id !== item.id);
      }
      setFolders(folderList);
      setCurrentFolderId(parentId);
    } catch (error) {
      console.error('Erreur chargement dossiers:', error);
    }
    setLoading(false);
  };

  const navigateToFolder = (folder) => {
    setBreadcrumb([...breadcrumb, { id: folder.id, name: folder.name }]);
    loadFolders(folder.id);
  };

  const navigateToBreadcrumb = (index) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    loadFolders(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleMove = () => {
    onMove(item, currentFolderId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md mx-4 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            Déplacer "{item?.name || item?.originalName}"
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/50 text-sm overflow-x-auto">
          {breadcrumb.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 text-slate-500 mx-1" />}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {item.name}
              </button>
            </div>
          ))}
        </div>

        {/* Liste des dossiers */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : folders.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Aucun sous-dossier</p>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-left"
                >
                  <Folder className="w-5 h-5 text-indigo-400" />
                  <span className="text-white truncate">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-slate-700">
          <p className="text-sm text-slate-400">
            Destination : <span className="text-white">{breadcrumb[breadcrumb.length - 1].name}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleMove}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
            >
              Déplacer ici
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;