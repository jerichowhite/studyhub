import { useState } from 'react';
import { getFileIcon, formatFileSize, getRelativeTime, downloadMaterial, deleteMaterial } from '../../services/materialService';

// Props:
//   material   – Firestore material document
//   currentUid – string
//   onClose    – fn()
//   onDeleted  – fn(materialId)
//   onDownload – fn(material) – optional override

const MaterialDetailModal = ({ material, currentUid, onClose, onDeleted }) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [dlCount, setDlCount] = useState(material?.downloads || 0);

  if (!material) return null;

  const { icon, bg } = getFileIcon(material.fileExt);
  const isOwn = material.uploaderId === currentUid;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await downloadMaterial(material);
      if (result.success) {
        setDlCount((c) => c + 1);
        showToast('Download started! ✅');
      } else {
        showToast(result.error || 'Download failed.', 'error');
      }
    } catch {
      showToast('Download failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteMaterial(material.id, currentUid);
    setDeleting(false);
    if (result.success) {
      if (onDeleted) onDeleted(material.id);
      onClose();
    } else {
      showToast(result.error || 'Delete failed.', 'error');
      setConfirmDelete(false);
    }
  };

  const uploadedDate = material.createdAt
    ? new Date(
        material.createdAt?.toMillis
          ? material.createdAt.toMillis()
          : material.createdAt
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 right-4 z-10 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center text-3xl shrink-0`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-800 text-base leading-snug mb-2">{material.title}</h2>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {material.courseCode}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                {material.materialType}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Level {material.level}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Uploader */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
              {material.uploaderAvatar
                ? <img src={material.uploaderAvatar} alt={material.uploaderName} className="w-full h-full object-cover" />
                : (material.uploaderName || '?').charAt(0).toUpperCase()
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{material.uploaderName}</p>
              <p className="text-xs text-gray-400">Uploaded {getRelativeTime(material.createdAt)}</p>
            </div>
            {isOwn && (
              <span className="ml-auto text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                Your upload
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {material.description || <span className="italic text-gray-400">No description provided.</span>}
            </p>
          </div>

          {/* File details */}
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">File Details</h3>
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              {[
                { label: 'File name',    value: material.fileName },
                { label: 'File size',    value: formatFileSize(material.fileSize) },
                { label: 'Format',       value: material.fileExt?.toUpperCase() },
                { label: 'Downloads',    value: `${dlCount} download${dlCount !== 1 ? 's' : ''}` },
                { label: 'Uploaded on',  value: uploadedDate },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <span className="text-xs text-gray-800 font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {material.tags?.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {material.tags.map((t) => (
                  <span key={t} className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-3">
                Are you sure you want to delete this material? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Deleting…
                    </>
                  ) : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3">
          {isOwn && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 transition"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Downloading…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetailModal;
