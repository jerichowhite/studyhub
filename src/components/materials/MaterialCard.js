import { getFileIcon, formatFileSize, getRelativeTime } from '../../services/materialService';

const MaterialCard = ({ material, currentUid, onView, onDownload }) => {
  const { Component: FileIcon, color, bg } = getFileIcon(material.fileExt);
  const isOwn = material.uploaderId === currentUid;

  return (
    <div
      onClick={() => onView(material)}
      className="group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm
        hover:shadow-md hover:scale-[1.02] hover:border-blue-100 dark:hover:border-blue-700
        transition-all duration-200 cursor-pointer flex flex-col gap-3"
    >
      {/* File icon + type badge */}
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
          <FileIcon className={`w-6 h-6 ${color}`} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-2 py-1 rounded-full">
          {material.fileExt?.toUpperCase() || 'FILE'}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
          {material.title}
        </h3>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-700">
          {material.courseCode}
        </span>
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-600">
          {material.materialType}
        </span>
        {isOwn && (
          <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-700">
            Yours
          </span>
        )}
      </div>

      {/* Uploader info */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center overflow-hidden shrink-0">
          {material.uploaderAvatar
            ? <img src={material.uploaderAvatar} alt={material.uploaderName} className="w-full h-full object-cover" />
            : (material.uploaderName || '?').charAt(0).toUpperCase()
          }
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{material.uploaderName}</span>
        <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0">· {getRelativeTime(material.createdAt)}</span>
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
          <span>📥 {material.downloads || 0}</span>
          <span>{formatFileSize(material.fileSize)}</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDownload(material); }}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 dark:border-blue-700"
          aria-label="Download"
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default MaterialCard;
