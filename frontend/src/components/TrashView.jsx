import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Trash2, RotateCcw, AlertTriangle, FileText, Folder } from 'lucide-react';

const TrashView = ({ onStorageUpdate }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const response = await API.get('/files/trash');
      setFiles(response.data.files || []);
      setFolders(response.data.folders || []);
    } catch (error) {
      console.error('Erreur chargement corbeille:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (type, id) => {
    try {
      if (type === 'file') {
        await API.patch(`/files/${id}/restore`);
      } else {
        await API.patch(`/folders/${id}/restore`);
      }
      fetchTrash();
    } catch (error) {
      console.error('Erreur restauration:', error);
    }
  };

  const handlePermanentDelete = async (type, id) => {
    if (!confirm('Supprimer définitivement ? Cette action est irréversible.')) return;
    
    try {
      if (type === 'file') {
        const response = await API.delete(`/files/${id}/permanent`);
        if (response.data.storageUsed !== undefined) {
          onStorageUpdate(response.data.storageUsed);
        }
      } else {
        await API.delete(`/folders/${id}/permanent`);
      }
      fetchTrash();
    } catch (error) {
      console.error('Erreur suppression définitive:', error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Vider toute la corbeille ? Cette action est irréversible.')) return;
    
    try {
      const response = await API.delete('/files/trash/empty');
      if (response.data.storageUsed !== undefined) {
        onStorageUpdate(response.data.storageUsed);
      }
      fetchTrash();
    } catch (error) {
      console.error('Erreur vidage corbeille:', error);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const isEmpty = files.length === 0 && folders.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trash2 className="w-6 h-6 text-slate-400" />
          <h2 className="text-xl font-semibold text-white">Corbeille</h2>
        </div>
        
        {!isEmpty && (
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Vider la corbeille
          </button>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Trash2 className="w-16 h-16 mb-4 opacity-50" />
          <p>La corbeille est vide</p>
        </div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={`folder-${folder.id}`}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{folder.name}</p>
                  <p className="text-sm text-slate-400">
                    Supprimé le {formatDate(folder.deletedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore('folder', folder.id)}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                  title="Restaurer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePermanentDelete('folder', folder.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {files.map((file) => (
            <div
              key={`file-${file.id}`}
              className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{file.originalName || file.name}</p>
                  <p className="text-sm text-slate-400">
                    {formatSize(file.size)} • Supprimé le {formatDate(file.deletedAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore('file', file.id)}
                  className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                  title="Restaurer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePermanentDelete('file', file.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashView;