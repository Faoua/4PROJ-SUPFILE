import { useState } from 'react';
import { X, Link, Copy, Check, Calendar, Lock } from 'lucide-react';
import API from '../api/axios';

const ShareModal = ({ item, onClose }) => {
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');

  const createShare = async () => {
    setLoading(true);
    try {
      const endpoint = item.type === 'folder' ? `/folders/${item.id}/share` : `/files/${item.id}/share`;
      const response = await API.post(endpoint, {
        expiresAt: expiresAt || null,
        password: password || null
      });
      
      const baseUrl = window.location.origin;
      setShareLink(`${baseUrl}/share/${response.data.token}`);
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Link className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Partager</h2>
              <p className="text-sm text-slate-400 truncate max-w-[200px]">{item.name || item.originalName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!shareLink ? (
            <>
              {/* Expiration */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Lock className="w-4 h-4" />
                  Mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <button
                onClick={createShare}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer le lien'}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-xl">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 bg-transparent text-white text-sm outline-none"
                />
                <button
                  onClick={copyLink}
                  className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-sm text-slate-400 text-center">
                {copied ? '✓ Lien copié !' : 'Partagez ce lien pour donner accès au fichier'}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;