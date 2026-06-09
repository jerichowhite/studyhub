import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SearchFilters from '../components/materials/SearchFilters';
import MaterialsList from '../components/materials/MaterialsList';
import UploadModal from '../components/materials/UploadModal';
import MaterialDetailModal from '../components/materials/MaterialDetailModal';
import { searchMaterials, downloadMaterial } from '../services/materialService';

// Simple debounce hook
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ─── Materials Page ───────────────────────────────────────────────────────────

const Materials = () => {
  const { currentUser, userProfile } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    course: 'all',
    type: 'all',
    level: 'all',
    sortBy: 'createdAt',
  });

  const [showUpload, setShowUpload] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch materials ────────────────────────────────────────────────────────
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchMaterials(debouncedSearch, {
        course: filters.course !== 'all' ? filters.course : undefined,
        type:   filters.type   !== 'all' ? filters.type   : undefined,
        level:  filters.level  !== 'all' ? filters.level  : undefined,
        sortBy: filters.sortBy,
      });
      setMaterials(results);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
      showToast('Failed to load materials. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters, showToast]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleUploadSuccess = useCallback(() => {
    showToast('Material uploaded successfully! +10 points 🎉');
    fetchMaterials();
  }, [fetchMaterials, showToast]);

  const handleDownload = useCallback(async (material) => {
    const result = await downloadMaterial(material);
    if (result.success) {
      showToast('Download started! ✅');
      // Optimistically update download count in the list
      setMaterials((prev) =>
        prev.map((m) => m.id === material.id ? { ...m, downloads: (m.downloads || 0) + 1 } : m)
      );
    } else {
      showToast(result.error || 'Download failed.', 'error');
    }
  }, [showToast]);

  const handleDeleted = useCallback((materialId) => {
    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    showToast('Material deleted.');
  }, [showToast]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const uploadedCount = materials.filter((m) => m.uploaderId === currentUser?.uid).length;
  const hasFilters = filters.course !== 'all' || filters.type !== 'all' || filters.level !== 'all';

  const courses = userProfile?.courses || [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full">
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 max-w-xs
            ${toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400'
            }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Course Materials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share and access study resources with your classmates</p>
        </div>

        {/* Desktop upload button */}
        <button
          onClick={() => setShowUpload(true)}
          className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-105 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Material
        </button>
      </div>

      {/* ── Search + Filters ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 mb-6">
        <SearchFilters
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          filters={filters}
          onFilterChange={handleFilterChange}
          courses={courses}
          totalCount={materials.length}
          uploadedCount={uploadedCount}
        />
      </div>

      {/* ── Materials grid ────────────────────────────────────────────────── */}
      <MaterialsList
        materials={materials}
        loading={loading}
        currentUid={currentUser?.uid}
        searchTerm={debouncedSearch}
        hasFilters={hasFilters}
        onView={setSelectedMaterial}
        onDownload={handleDownload}
        onUpload={() => setShowUpload(true)}
      />

      {/* ── Mobile FAB (upload button) ────────────────────────────────────── */}
      <button
        onClick={() => setShowUpload(true)}
        className="sm:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110"
        aria-label="Upload material"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showUpload && (
        <UploadModal
          userProfile={userProfile}
          currentUser={currentUser}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {selectedMaterial && (
        <MaterialDetailModal
          material={selectedMaterial}
          currentUid={currentUser?.uid}
          onClose={() => setSelectedMaterial(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default Materials;
