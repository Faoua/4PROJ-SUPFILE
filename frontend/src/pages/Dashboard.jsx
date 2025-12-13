import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FileGrid from '../components/FileGrid';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import MoveModal from '../components/MoveModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit] = useState(30 * 1024 * 1024 * 1024);
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [currentView, setCurrentView] = useState('files');
  
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [moveItem, setMoveItem] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      
      if (currentView === 'recent') {
        const response = await API.get('/recent');
        setFiles(response.data.files || []);
        setFolders(response.data.folders || []);
      } else if (currentView === 'favorites') {
        const response = await API.get('/favorites');
        setFiles(response.data.files || []);
        setFolders(response.data.folders || []);
      } else if (currentView === 'trash') {
        const response = await API.get('/files', { params: { includeDeleted: 'true' } });
        const allFiles = response.data.files || [];
        setFiles(allFiles.filter(f => f.isDeleted));
        setFolders([]);
      } else {
        const [filesRes, foldersRes] = await Promise.all([
          API.get('/files', { params: { folderId: currentFolder } }),
          API.get('/folders', { params: { parentId: currentFolder } })
        ]);
        
        setFiles(filesRes.data.files || []);
        setFolders(foldersRes.data.folders || []);
        
        if (filesRes.data.storageUsed !== undefined) {
          setStorageUsed(filesRes.data.storageUsed);
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder, currentView]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    setCurrentFolder(null);
    setFolderPath([]);
    setSearchResults(null);
    setSearchQuery('');
  };

  const navigateToFolder = (folderId, folderName) => {
    if (currentView !== 'files') {
      setCurrentView('files');
    }
    if (folderId) {
      setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    }
    setCurrentFolder(folderId);
    setSearchResults(null);
    setSearchQuery('');
  };

  const navigateBack = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1]?.id || null);
    }
    setSearchResults(null);
    setSearchQuery('');
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      const response = await API.get('/search', { params: { q: query } });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Erreur recherche:', error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    
    try {
      if (type === 'file') {
        await API.delete(`/files/${id}`);
      } else {
        await API.delete(`/folders/${id}`);
      }
      fetchFiles();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleRename = async (type, id, newName) => {
    try {
      if (type === 'file') {
        await API.patch(`/files/${id}/rename`, { newName });
      } else {
        await API.patch(`/folders/${id}/rename`, { newName });
      }
      fetchFiles();
    } catch (error) {
      console.error('Erreur renommage:', error);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await API.get(`/files/${file.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName || file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
    }
  };

  const handleDownloadZip = async (folder) => {
    try {
      const response = await API.get(`/folders/${folder.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${folder.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
      alert('Erreur lors du téléchargement du dossier');
    }
  };

  const handleToggleFavorite = async (type, id) => {
    try {
      if (type === 'file') {
        await API.patch(`/files/${id}/favorite`);
      } else {
        await API.patch(`/folders/${id}/favorite`);
      }
      fetchFiles();
    } catch (error) {
      console.error('Erreur favori:', error);
    }
  };

  const handleMove = async (item, targetFolderId) => {
    try {
      if (item.type === 'file') {
        await API.patch(`/files/${item.id}/move`, { folderId: targetFolderId });
      } else {
        await API.patch(`/folders/${item.id}/move`, { newParentId: targetFolderId });
      }
      fetchFiles();
    } catch (error) {
      console.error('Erreur déplacement:', error);
      alert('Erreur lors du déplacement');
    }
  };

  const displayFiles = searchResults ? searchResults.files || [] : files;
  const displayFolders = searchResults ? searchResults.folders || [] : folders;

  const getViewTitle = () => {
    switch (currentView) {
      case 'recent': return 'Récents';
      case 'favorites': return 'Favoris';
      case 'trash': return 'Corbeille';
      default: return 'Mes fichiers';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar 
        storageUsed={storageUsed} 
        storageLimit={storageLimit}
        currentView={currentView}
        onViewChange={handleViewChange}
        onNavigateHome={() => { handleViewChange('files'); navigateBack(-1); }}
      />
      
      <div className="flex-1 flex flex-col">
        <Header 
          user={user}
          searchQuery={searchQuery}
          onSearch={handleSearch}
          view={view}
          onViewChange={setView}
          onUpload={() => setShowUpload(true)}
          onCreateFolder={() => setShowCreateFolder(true)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button 
              onClick={() => { handleViewChange('files'); navigateBack(-1); }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {getViewTitle()}
            </button>
            {currentView === 'files' && folderPath.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <span className="text-slate-600">/</span>
                <button
                  onClick={() => navigateBack(index)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>

          {searchQuery && (
            <div className="mb-4 text-slate-400">
              Résultats pour "{searchQuery}"
            </div>
          )}

          <FileGrid
            files={displayFiles}
            folders={displayFolders}
            loading={loading}
            view={view}
            onFolderClick={navigateToFolder}
            onFilePreview={setPreviewFile}
            onDelete={handleDelete}
            onRename={handleRename}
            onDownload={handleDownload}
            onDownloadZip={handleDownloadZip}
            onShare={setShareItem}
            onToggleFavorite={handleToggleFavorite}
            onMove={currentView === 'files' ? setMoveItem : null}
            showFavoriteOption={currentView !== 'trash'}
          />
        </main>
      </div>

      {showUpload && (
        <UploadModal
          currentFolder={currentFolder}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchFiles(); }}
        />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          currentFolder={currentFolder}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={() => { setShowCreateFolder(false); fetchFiles(); }}
        />
      )}

      {previewFile && (
        <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {shareItem && (
        <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
      )}

      {moveItem && (
        <MoveModal
          isOpen={!!moveItem}
          item={moveItem}
          onClose={() => setMoveItem(null)}
          onMove={handleMove}
        />
      )}
    </div>
  );
};

export default Dashboard;