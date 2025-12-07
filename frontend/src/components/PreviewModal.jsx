import { useState, useEffect } from 'react';
import { X, Download, FileText } from 'lucide-react';
import API from '../api/axios';

const PreviewModal = ({ file, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const infoRes = await API.get(`/files/${file.id}/preview-info`);
        setPreviewType(infoRes.data.previewType);

        if (infoRes.data.canPreview) {
          if (infoRes.data.previewType === 'text') {
            const res = await API.get(`/files/${file.id}/preview`);
            setTextContent(res.data);
          } else {
            const res = await API.get(`/files/${file.id}/preview`, { responseType: 'blob' });
            setPreviewUrl(URL.createObjectURL(res.data));
          }
        }
      } catch (error) {
        console.error('Preview error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file.id]);

  const handleDownload = async () => {
    try {
      const response = await API.get(`/files/${file.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName || file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return <img src={previewUrl} alt={file.originalName} className="max-w-full max-h-[70vh] object-contain mx-auto" />;
      case 'video':
        return <video src={previewUrl} controls className="max-w-full max-h-[70vh] mx-auto" />;
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText className="w-16 h-16 text-slate-400 mb-4" />
            <audio src={previewUrl} controls className="w-full max-w-md" />
          </div>
        );
      case 'pdf':
        return <iframe src={previewUrl} className="w-full h-[70vh]" title="PDF Preview" />;
      case 'text':
        return (
          <pre className="bg-slate-900 p-4 rounded-lg overflow-auto max-h-[70vh] text-slate-300 text-sm">
            {textContent}
          </pre>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FileText className="w-16 h-16 mb-4" />
            <p>Aperçu non disponible</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white truncate">{file.originalName || file.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;