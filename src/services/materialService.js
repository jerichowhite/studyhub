
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import { notifyNewMaterial } from './notificationService';
import { FileText, File, FileArchive, BarChart2 } from 'lucide-react';

// ─── Allowed file types ───────────────────────────────────────────────────────

export const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];

export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt', 'zip'];
export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export const MATERIAL_TYPES = [
  'Lecture Notes',
  'Assignments',
  'Past Papers',
  'Slides/Presentations',
  'Study Guides',
  'Books/Textbooks',
  'Practice Questions',
  'Other',
];

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file to Firebase Storage and save metadata to Firestore.
 * @param {File}     file      - File object selected by the user
 * @param {Object}   metadata  - Form fields (title, description, courseCode, etc.)
 * @param {string}   userId    - Firebase Auth UID
 * @param {Function} onProgress - Called with 0-100 progress value
 * @returns {{ success, materialId, downloadURL } | { success: false, error }}
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadMaterial = async (file, metadata, userId, onProgress) => {
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File size exceeds limit. Max 1MB for prototype demo.' };
  }

  try {
    if (onProgress) onProgress(10);
    const base64Data = await fileToBase64(file);
    if (onProgress) onProgress(50);
    
    const ext = file.name.split('.').pop();
    
    const materialDoc = await addDoc(collection(db, 'materials'), {
      ...metadata,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileExt: ext.toLowerCase(),
      uploaderId: userId,
      fileData: base64Data, // Store Base64 directly
      downloads: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (onProgress) onProgress(90);

    // Award uploader 10 points
    await _awardPoints(userId, 10, 'material_upload');

    // Increment user's materialsUploaded stat
    await updateDoc(doc(db, 'users', userId), {
      'stats.materialsUploaded': increment(1),
    }).catch(() => {});

    // Notify other students enrolled in the same course (fire-and-forget)
    if (metadata.courseCode) {
      _notifyCoursemates(userId, materialDoc.id, metadata).catch(() => {});
    }

    if (onProgress) onProgress(100);
    return { success: true, materialId: materialDoc.id };
  } catch (err) {
    console.error('Firestore save error:', err);
    return { success: false, error: err.message };
  }
};

// ─── Fetch / Search ───────────────────────────────────────────────────────────

/**
 * Fetch materials from Firestore with optional filters.
 * Falls back to client-side sort if needed to avoid composite index requirements.
 */
export const getMaterials = async (filters = {}) => {
  try {
    const constraints = [];

    if (filters.course && filters.course !== 'all') {
      constraints.push(where('courseCode', '==', filters.course));
    }
    if (filters.type && filters.type !== 'all') {
      constraints.push(where('materialType', '==', filters.type));
    }
    if (filters.level && filters.level !== 'all') {
      constraints.push(where('level', '==', Number(filters.level)));
    }

    // To avoid Firestore composite index issues, only apply orderBy when no
    // equality filters are in play, then sort client-side otherwise.
    const needsClientSort = constraints.length > 0;

    if (!needsClientSort) {
      const sortField = filters.sortBy === 'downloads' ? 'downloads' : 'createdAt';
      constraints.push(orderBy(sortField, 'desc'));
    }

    if (filters.pageSize) {
      constraints.push(limit(filters.pageSize));
    }

    const q = query(collection(db, 'materials'), ...constraints);
    const snap = await getDocs(q);

    let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Client-side sort when equality filters are present
    if (needsClientSort) {
      if (filters.sortBy === 'downloads') {
        results.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
      } else if (filters.sortBy === 'title') {
        results.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } else {
        // default: createdAt desc
        results.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
      }
    }

    return results;
  } catch (err) {
    console.error('getMaterials error:', err);
    return [];
  }
};

/**
 * Client-side text search over fetched materials.
 */
export const searchMaterials = async (searchTerm, filters = {}) => {
  const all = await getMaterials(filters);

  if (!searchTerm?.trim()) return all;

  const term = searchTerm.toLowerCase();
  return all.filter(
    (m) =>
      m.title?.toLowerCase().includes(term) ||
      m.description?.toLowerCase().includes(term) ||
      m.courseCode?.toLowerCase().includes(term) ||
      m.courseName?.toLowerCase().includes(term) ||
      m.tags?.some((t) => t.toLowerCase().includes(term))
  );
};

// ─── Download ─────────────────────────────────────────────────────────────────

/**
 * Trigger a browser download and increment the download counter.
 * Also awards 2 points to the uploader.
 */
export const base64ToBlob = (base64, mimeType = '') => {
  if (!base64.includes(';base64,')) return new Blob([], { type: mimeType });
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1] || mimeType;
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
};

export const downloadMaterial = async (material) => {
  try {
    await updateDoc(doc(db, 'materials', material.id), {
      downloads: increment(1),
    });

    // Award uploader 2 points per download
    if (material.uploaderId) {
      await _awardPoints(material.uploaderId, 2, 'material_downloaded').catch(() => {});
    }

    if (material.fileData) {
      const blob = base64ToBlob(material.fileData, material.fileType);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (material.downloadURL) { // Fallback for old files
      // Trigger browser download
      const link = document.createElement('a');
      link.href = material.downloadURL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = material.fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return { success: true };
  } catch (err) {
    console.error('downloadMaterial error:', err);
    return { success: false, error: err.message };
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Hard-delete a material from Storage and Firestore.
 * Only the original uploader can delete.
 */
export const deleteMaterial = async (materialId, userId) => {
  try {
    const snap = await getDoc(doc(db, 'materials', materialId));
    if (!snap.exists()) return { success: false, error: 'Material not found.' };

    const data = snap.data();
    if (data.uploaderId !== userId) {
      return { success: false, error: 'Unauthorized: you can only delete your own materials.' };
    }

    // Delete from Firestore
    await deleteDoc(doc(db, 'materials', materialId));

    return { success: true };
  } catch (err) {
    console.error('deleteMaterial error:', err);
    return { success: false, error: err.message };
  }
};

// ─── Notification helper ──────────────────────────────────────────────────────

/**
 * Notify up to 50 students in the same course that new material was uploaded.
 * Runs fire-and-forget after a successful upload.
 */
const _notifyCoursemates = async (uploaderId, materialId, metadata) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('courses', 'array-contains', metadata.courseCode),
      limit(50)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs
        .filter((d) => d.id !== uploaderId)
        .map((d) =>
          notifyNewMaterial(d.id, {
            id:         materialId,
            courseCode: metadata.courseCode,
            title:      metadata.title || 'Untitled',
          })
        )
    );
  } catch (err) {
    console.warn('_notifyCoursemates failed (non-fatal):', err.message);
  }
};

// ─── Gamification helper ──────────────────────────────────────────────────────

const _awardPoints = async (userId, amount, reason) => {
  try {
    const { awardPoints } = await import('./gamificationService');
    const label = reason === 'material_upload' ? 'Material Uploaded' : 'Material Downloaded';
    await awardPoints(userId, amount, label, reason);
  } catch (err) {
    console.warn('_awardPoints failed (non-fatal):', err.message);
  }
};

// ─── Utilities ────────────────────────────────────────────────────────────────

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileIcon = (ext) => {
  const map = {
    pdf:  { Component: FileText,    color: 'text-red-500',    bg: 'bg-red-50'    },
    doc:  { Component: FileText,    color: 'text-blue-500',   bg: 'bg-blue-50'   },
    docx: { Component: FileText,    color: 'text-blue-500',   bg: 'bg-blue-50'   },
    ppt:  { Component: BarChart2,   color: 'text-orange-500', bg: 'bg-orange-50' },
    pptx: { Component: BarChart2,   color: 'text-orange-500', bg: 'bg-orange-50' },
    txt:  { Component: FileText,    color: 'text-gray-500',   bg: 'bg-gray-50'   },
    zip:  { Component: FileArchive, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  };
  return map[(ext || '').toLowerCase()] || { Component: File, color: 'text-gray-500', bg: 'bg-gray-50' };
};

export const getRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const ms = timestamp?.toMillis ? timestamp.toMillis() : Number(timestamp);
  const diff = Date.now() - ms;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString();
};
