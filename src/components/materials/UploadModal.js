import { useState, useRef, useCallback } from 'react';
import { Upload, CheckCircle, X } from 'lucide-react';
import { ALLOWED_EXTENSIONS, MAX_FILE_SIZE, MATERIAL_TYPES, uploadMaterial, getFileIcon, formatFileSize } from '../../services/materialService';

const ACCEPTED_MIME = '.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip';

const TagInput = ({ tags, onChange }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const t = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 5) {
      onChange([...tags, t]);
    }
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 min-h-[42px] focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-transparent">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-blue-900 dark:hover:text-blue-100">×</button>
        </span>
      ))}
      {tags.length < 5 && (
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={addTag}
          placeholder={tags.length === 0 ? 'Add tags (Enter after each)…' : ''}
          className="flex-1 bg-transparent text-xs outline-none min-w-[100px] placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
        />
      )}
    </div>
  );
};

const UploadModal = ({ userProfile, currentUser, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [dragging, setDragging] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    courseCode: '',
    materialType: '',
    level: String(userProfile?.level || '400'),
    tags: [],
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const validateFile = (f) => {
    if (!f) return 'Please select a file.';
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Only ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} files are allowed.`;
    }
    if (f.size > MAX_FILE_SIZE) return `File size exceeds 10 MB limit (${formatFileSize(f.size)}).`;
    return '';
  };

  const applyFile = (f) => {
    const err = validateFile(f);
    setFileError(err);
    if (!err) {
      setFile(f);
      if (!form.title) {
        const base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
        setForm((p) => ({ ...p, title: base.substring(0, 100) }));
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const validate = () => {
    const errs = {};
    if (!file) errs.file = 'Please select a file.';
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.courseCode) errs.courseCode = 'Please select a course.';
    if (!form.materialType) errs.materialType = 'Please select a material type.';
    return errs;
  };

  const handleUpload = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setUploading(true);

    const courseFull = (userProfile?.courses || []).find(
      (c) => c.startsWith(form.courseCode)
    ) || form.courseCode;
    const courseName = courseFull.split(' - ')[1]?.trim() || form.courseCode;

    const metadata = {
      title: form.title.trim(),
      description: form.description.trim(),
      courseCode: form.courseCode,
      courseName,
      materialType: form.materialType,
      level: Number(form.level),
      department: userProfile?.department || '',
      university: userProfile?.university || '',
      uploaderName: userProfile?.displayName || currentUser?.displayName || 'Anonymous',
      uploaderAvatar: userProfile?.photoURL || currentUser?.photoURL || '',
      tags: form.tags,
    };

    const result = await uploadMaterial(file, metadata, currentUser.uid, setProgress);

    if (result.success) {
      setDone(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(result);
        onClose();
      }, 2000);
    } else {
      setErrors({ submit: result.error || 'Upload failed. Please try again.' });
      setUploading(false);
      setProgress(0);
    }
  };

  const fileIconData = file
    ? getFileIcon(file.name.split('.').pop())
    : null;

  const courses = userProfile?.courses || [
    'CSC 411 - Net-Centric Computing',
    'CSC 412 - Software Engineering',
    'CSC 413 - Advanced DBMS',
    'CSC 414 - System Analysis and Design',
    'CSC 415 - Artificial Intelligence',
    'CSC 417 - Human Computer Interaction',
    'CSC 419 - Operating Systems',
  ];

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition
     text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500
     ${hasError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'}`;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="font-bold text-gray-800 dark:text-white text-lg">Upload Course Material</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Share resources with your classmates · earn +10 pts</p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading && !done}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-2">Material uploaded!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Your material is now available to your classmates.</p>
            <p className="text-green-600 dark:text-green-400 font-semibold text-sm">+10 points earned!</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Drop zone */}
              <div>
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
                      ${dragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'}
                      ${errors.file ? 'border-red-300 dark:border-red-700' : ''}
                    `}
                  >
                    <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm">Drag & drop file here</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">or click to browse</p>
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-3">
                      PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP · Max 10 MB
                    </p>
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 ${fileIconData?.bg || 'bg-gray-50'}`}>
                    {fileIconData && <fileIconData.Component className={`w-8 h-8 ${fileIconData.color}`} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      onClick={() => { setFile(null); setFileError(''); }}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME} onChange={handleFileInput} className="hidden" />
                {(fileError || errors.file) && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">{fileError || errors.file}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value.slice(0, 100) }))}
                  placeholder="e.g. CSC 411 Midterm Notes – Chapter 1-5"
                  className={inputClass(errors.title)}
                />
                <div className="flex justify-between mt-1">
                  {errors.title && <p className="text-xs text-red-500 font-medium">{errors.title}</p>}
                  <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-auto">{form.title.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value.slice(0, 500) }))}
                  placeholder="Briefly describe what this material covers…"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-none transition"
                />
                <span className="text-[10px] text-gray-300 dark:text-gray-600 float-right">{form.description.length}/500</span>
              </div>

              {/* Course + Type row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.courseCode}
                    onChange={(e) => setForm((p) => ({ ...p, courseCode: e.target.value }))}
                    className={inputClass(errors.courseCode) + ' appearance-none'}
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => {
                      const code = c.split(' - ')[0]?.trim();
                      return <option key={code} value={code}>{c}</option>;
                    })}
                  </select>
                  {errors.courseCode && <p className="text-xs text-red-500 mt-1 font-medium">{errors.courseCode}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.materialType}
                    onChange={(e) => setForm((p) => ({ ...p, materialType: e.target.value }))}
                    className={inputClass(errors.materialType) + ' appearance-none'}
                  >
                    <option value="">Select type</option>
                    {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.materialType && <p className="text-xs text-red-500 mt-1 font-medium">{errors.materialType}</p>}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                  className={inputClass(false) + ' appearance-none'}
                >
                  {['100','200','300','400','500'].map((l) => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 block">
                  Tags <span className="text-gray-400 font-normal">(optional, up to 5)</span>
                </label>
                <TagInput tags={form.tags} onChange={(tags) => setForm((p) => ({ ...p, tags }))} />
              </div>

              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
                  ⚠️ {errors.submit}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
              {uploading && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Uploading…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    <>Upload Material</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
