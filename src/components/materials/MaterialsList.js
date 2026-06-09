import React from 'react';
import { FolderOpen } from 'lucide-react';
import MaterialCard from './MaterialCard';

const PAGE_SIZE = 20;

// Skeleton loader card
const SkeletonCard = () => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm animate-pulse flex flex-col gap-3">
    <div className="w-12 h-12 bg-gray-100 rounded-xl" />
    <div className="space-y-2">
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="h-3 bg-gray-100 rounded w-3/5" />
    </div>
    <div className="flex gap-2">
      <div className="h-5 w-16 bg-gray-100 rounded-full" />
      <div className="h-5 w-20 bg-gray-100 rounded-full" />
    </div>
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 bg-gray-100 rounded-full" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
      <div className="h-3 w-20 bg-gray-100 rounded" />
      <div className="h-6 w-20 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

// Empty state
const EmptyState = ({ searchTerm, hasFilters, onUpload }) => (
  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
    <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg mb-2">No materials found</h3>
    <p className="text-sm text-gray-400 max-w-xs mb-6">
      {searchTerm
        ? 'Try different search terms or remove some filters.'
        : hasFilters
          ? 'Try adjusting your filters to see more results.'
          : 'Be the first to upload course materials for your classmates!'
      }
    </p>
    {onUpload && (
      <button
        onClick={onUpload}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
      >
        Upload Material
      </button>
    )}
  </div>
);

// Pagination controls
const Pagination = ({ page, total, pageSize, onPage }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= Math.min(totalPages, 10); i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-8">
      <span className="text-xs text-gray-400">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          ‹ Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors
              ${p === page
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Next ›
        </button>
      </div>
    </div>
  );
};

// Props:
//   materials   – full array of material objects
//   loading     – boolean
//   currentUid  – string
//   searchTerm  – string
//   hasFilters  – boolean
//   onView      – fn(material)
//   onDownload  – fn(material)
//   onUpload    – fn()

const MaterialsList = ({
  materials,
  loading,
  currentUid,
  searchTerm,
  hasFilters,
  onView,
  onDownload,
  onUpload,
}) => {
  const [page, setPage] = React.useState(1);

  // Reset to page 1 when results change
  React.useEffect(() => { setPage(1); }, [materials.length]);

  const paginated = materials.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : paginated.length === 0
            ? <EmptyState searchTerm={searchTerm} hasFilters={hasFilters} onUpload={onUpload} />
            : paginated.map((m) => (
                <MaterialCard
                  key={m.id}
                  material={m}
                  currentUid={currentUid}
                  onView={onView}
                  onDownload={onDownload}
                />
              ))
        }
      </div>

      {!loading && materials.length > PAGE_SIZE && (
        <Pagination
          page={page}
          total={materials.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      )}
    </div>
  );
};

export default MaterialsList;
