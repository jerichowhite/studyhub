import { useState, useEffect } from 'react';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const fileIcon = (type = '') => {
  if (type.includes('pdf'))   return '📄';
  if (type.includes('image')) return '🖼️';
  if (type.includes('word') || type.includes('docx')) return '📝';
  if (type.includes('ppt'))   return '📊';
  if (type.includes('zip'))   return '🗜️';
  return '📁';
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const FileQuickAccess = ({ onFileSelect, onAskAIAboutFile }) => {
  const { currentUser } = useAuth();
  const [files,      setFiles]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [preview,    setPreview]    = useState(null); // file object

  useEffect(() => {
    if (!currentUser?.uid) return;
    // No orderBy to avoid requiring a composite index — sort client-side instead
    const q = query(
      collection(db, 'materials'),
      where('uploaderId', '==', currentUser.uid),
      limit(30)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort by createdAt descending on the client
        docs.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });
        setFiles(docs);
        setLoading(false);
      },
      (error) => {
        console.error('Files listener error:', error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser?.uid]);

  const filtered = files.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.title?.toLowerCase().includes(q) ||
      f.courseCode?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full p-3">
      <h3 className="text-sm font-bold text-gray-800 mb-2">📁 Quick Files</h3>

      {/* Search */}
      <div className="relative mb-3">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
        <input
          type="text"
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {loading && (
          <p className="text-xs text-center text-gray-400 py-4">Loading…</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📂</div>
            <p className="text-xs">
              {search ? 'No matching files' : 'No files uploaded yet'}
            </p>
          </div>
        )}

        {filtered.map((file) => (
          <div
            key={file.id}
            onClick={() => setPreview(file)}
            className="p-2.5 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl flex-shrink-0">{fileIcon(file.fileType)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{file.title}</p>
                <p className="text-[10px] text-gray-500">{file.courseCode}</p>
                <p className="text-[10px] text-gray-400">{formatSize(file.fileSize)}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onFileSelect && onFileSelect(file); }}
                className="flex-1 text-[10px] bg-blue-50 text-blue-600 py-1 rounded hover:bg-blue-100 font-medium"
              >
                Open
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAskAIAboutFile && onAskAIAboutFile(file); }}
                className="flex-1 text-[10px] bg-purple-50 text-purple-600 py-1 rounded hover:bg-purple-100 font-medium"
              >
                🤖 Ask AI
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Inline preview modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[3000] p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-2xl">{fileIcon(preview.fileType)}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{preview.title}</p>
                  <p className="text-xs text-gray-500">{preview.courseCode} · {formatSize(preview.fileSize)}</p>
                </div>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-5">
              {preview.description && (
                <p className="text-sm text-gray-600 mb-4">{preview.description}</p>
              )}

              {/* PDF embed */}
              {preview.fileType?.includes('pdf') && preview.downloadURL && (
                <iframe
                  src={preview.downloadURL}
                  title={preview.title}
                  className="w-full h-64 border rounded-lg"
                />
              )}

              {/* Image */}
              {preview.fileType?.includes('image') && preview.downloadURL && (
                <img
                  src={preview.downloadURL}
                  alt={preview.title}
                  className="max-w-full rounded-lg"
                />
              )}

              {/* Generic info */}
              {!preview.fileType?.includes('pdf') && !preview.fileType?.includes('image') && (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
                  <div className="text-4xl mb-2">{fileIcon(preview.fileType)}</div>
                  <p>Preview not available for this file type.</p>
                </div>
              )}

              {preview.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {preview.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-3 border-t border-gray-100">
              {preview.downloadURL && (
                <a
                  href={preview.downloadURL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  📥 Download
                </a>
              )}
              <button
                onClick={() => { onAskAIAboutFile && onAskAIAboutFile(preview); setPreview(null); }}
                className="flex-1 text-sm bg-purple-50 text-purple-600 py-2 rounded-lg hover:bg-purple-100 font-medium"
              >
                🤖 Ask AI about this
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileQuickAccess;
