import { Search, Grid, List, Upload, FolderPlus, User } from 'lucide-react';

const Header = ({ user, searchQuery, onSearch, view, onViewChange, onUpload, onCreateFolder }) => {
  return (
    <header className="h-16 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Rechercher des fichiers..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* View Toggle */}
        <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
          <button
            onClick={() => onViewChange('grid')}
            className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Create Folder */}
        <button
          onClick={onCreateFolder}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white transition-all"
        >
          <FolderPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau dossier</span>
        </button>

        {/* Upload */}
        <button
          onClick={onUpload}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-xl text-white transition-all shadow-lg shadow-indigo-500/25"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;