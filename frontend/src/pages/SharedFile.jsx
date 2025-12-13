import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import { Cloud, Download, Lock, AlertCircle, FileText } from 'lucide-react';

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
  const itemName = shareData?.data?.originalName || shareData?.data?.name || 'Fichier partagé';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">SUPFile</h1>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">{itemName}</h2>
          
          {shareData?.data?.size && (
            <p className="text-slate-400 text-sm mb-4">
              {(shareData.data.size / 1024 / 1024).toFixed(2)} Mo
            </p>
          )}
          
          <button
            onClick={handleDownload}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" />
            Télécharger
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedFile;