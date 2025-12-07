import { Cloud, Home, FolderOpen, Trash2, Star, Clock, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ storageUsed, storageLimit, onNavigateHome }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercent = (storageUsed / storageLimit) * 100;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">SUPFile</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <button
          onClick={onNavigateHome}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/20 text-indigo-400 mb-2"
        >
          <Home className="w-5 h-5" />
          <span>Mes fichiers</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all mb-2">
          <Clock className="w-5 h-5" />
          <span>Récents</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all mb-2">
          <Star className="w-5 h-5" />
          <span>Favoris</span>
        </button>

        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all mb-2">
          <Trash2 className="w-5 h-5" />
          <span>Corbeille</span>
        </button>
      </nav>

      {/* Storage */}
      <div className="p-4 mx-4 mb-4 rounded-xl bg-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Stockage</span>
          <span className="text-xs text-slate-500">{usagePercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {formatSize(storageUsed)} / {formatSize(storageLimit)}
        </p>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;