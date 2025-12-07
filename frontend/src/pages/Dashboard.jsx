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
  
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareItem, setShareItem] = useState(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const [filesRes, foldersRes] = await Promise.all([
        API.get('/files', { params: { folderId: currentFolder } }),
        API.get('/folders', { params: { parentId: currentFolder } })
      ]);
      
      setFiles(filesRes.data.files || []);
      setFolders(foldersRes.data.folders || []);
      
      if (filesRes.data.storageUsed !== undefined) {
        setStorageUsed(filesRes.data.storageUsed);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const navigateToFolder = (folderId, folderName) => {
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

  const displayFiles = searchResults ? searchResults.files || [] : files;
  const displayFolders = searchResults ? searchResults.folders || [] : folders;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar 
        storageUsed={storageUsed} 
        storageLimit={storageLimit}
        onNavigateHome={() => navigateBack(-1)}
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
              onClick={() => navigateBack(-1)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Mes fichiers
            </button>
            {folderPath.map((folder, index) => (
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
            onShare={setShareItem}
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
    </div>
  );
};

export default Dashboard;