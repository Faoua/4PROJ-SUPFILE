import { useAuth } from '../context/AuthContext';
import { Cloud, Home, Clock, Star, Trash2, LogOut } from 'lucide-react';

const Sidebar = ({ storageUsed, storageLimit, currentView, onViewChange, onNavigateHome }) => {
  const { logout } = useAuth();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const usagePercent = ((storageUsed / storageLimit) * 100).toFixed(1);

  const menuItems = [
    { id: 'files', icon: Home, label: 'Mes fichiers' },
    { id: 'recent', icon: Clock, label: 'Récents' },
    { id: 'favorites', icon: Star, label: 'Favoris' },
    { id: 'trash', icon: Trash2, label: 'Corbeille' },
  ];

  return (
    <div className="w-64 bg-slate-800/50 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <span className="text-xl font-bold text-white">SUPFile</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Storage */}
      <div className="p-4 mx-4 mb-4 bg-slate-700/30 rounded-xl">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Stockage</span>
          <span className="text-slate-400">{usagePercent}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {formatSize(storageUsed)} / {formatSize(storageLimit)}
        </p>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;