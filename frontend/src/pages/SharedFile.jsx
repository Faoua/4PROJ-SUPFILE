import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { Cloud, Download, Lock, AlertCircle, FileText, Folder, File } from 'lucide-react';

const SharedFile = () => {
  const { token } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  const fetchShare = async (pwd = null) => {
    try {
      setLoading(true);
      setError('');
      const response = await API.get(`/share/${token}`, {
        params: pwd ? { password: pwd } : {}
      });
      setShareData(response.data);
      setNeedsPassword(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setNeedsPassword(true);
      } else {
        setError(err.response?.data?.message || 'Lien invalide ou expiré');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShare();
  }, [token]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    fetchShare(password);
  };

  const handleDownload = async () => {
    try {
      const response = await API.get(`/share/${token}/download`, {
        params: password ? { password } : {},
        responseType: 'blob'
      });
      
      // Récupérer le nom du fichier depuis le header Content-Disposition
      const contentDisposition = response.headers['content-disposition'];
      let filename = shareData?.data?.originalName || shareData?.data?.name || 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

// Télécharger un fichier spécifique du dossier
  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const response = await API.get(`/share/${token}/download`, {
        params: { fileId, ...(password ? { password } : {}) },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Fichier protégé</h1>
            <p className="text-slate-400 mt-2">Ce fichier nécessite un mot de passe</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white mb-4 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl"
            >
              Accéder
            </button>
          </form>
        </div>
      </div>
    );
  }

// Récupérer le nom du fichier/dossier
  const data = shareData?.data;
  const itemName = data?.originalName || data?.name || 'Fichier partagé';
  const isFolder = data?.type === 'folder';

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">SUPFile</h1>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          {/* En-tête */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-700">
            {isFolder ? (
              <Folder className="w-10 h-10 text-indigo-400" />
            ) : (
              <FileText className="w-10 h-10 text-slate-400" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">{itemName}</h2>
              {data?.size && (
                <p className="text-sm text-slate-400">{formatSize(data.size)}</p>
              )}
            </div>
          </div>

          {/* Contenu du dossier */}
          {isFolder && data?.contents && (
            <div className="mb-4">
              <h3 className="text-sm text-slate-400 mb-3">Contenu du dossier :</h3>
              
              {data.contents.folders?.length > 0 && (
                <div className="mb-3">
                  {data.contents.folders.map((folder) => (
                    <div key={folder.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg mb-2">
                      <Folder className="w-5 h-5 text-indigo-400" />
                      <span className="text-white">{folder.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {data.contents.files?.length > 0 && (
                <div>
                  {data.contents.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-slate-400" />
                        <div>
                          <span className="text-white">{file.name}</span>
                          <span className="text-xs text-slate-500 ml-2">{formatSize(file.size)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(file.id, file.name)}
                        className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(!data.contents.files?.length && !data.contents.folders?.length) && (
                <p className="text-slate-500 text-center py-4">Dossier vide</p>
              )}
            </div>
          )}

          {/* Bouton télécharger */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" />
            {isFolder ? 'Télécharger tout (ZIP)' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedFile;