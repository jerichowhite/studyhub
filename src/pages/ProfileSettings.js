import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, uploadProfilePhoto } from '../services/userService';
import { updateUserPassword, logoutUser, getFirebaseErrorMessage } from '../services/authService';
import { validateDisplayName, validatePassword, validateConfirmPassword, sanitizeInput } from '../utils/validation';

// Hardcoded courses list (same as ProfileSetup)
const CS_400_COURSES = [
  { code: 'CSC411', label: 'CSC 411 - Net-Centric Computing' },
  { code: 'CSC412', label: 'CSC 412 - Software Engineering' },
  { code: 'CSC413', label: 'CSC 413 - Advanced Database Management Systems' },
  { code: 'CSC414', label: 'CSC 414 - System Analysis and Design' },
  { code: 'CSC415', label: 'CSC 415 - Artificial Intelligence' },
  { code: 'CSC417', label: 'CSC 417 - Human Computer Interaction' },
  { code: 'CSC419', label: 'CSC 419 - Operating Systems' },
];

// ─── Reusable section wrapper ────────────────────────────────────────────────

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
    <div className="px-6 py-5">{children}</div>
  </div>
);

// ─── Toast notification ──────────────────────────────────────────────────────

const Toast = ({ message, type, onDismiss }) => {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm ${
        isSuccess
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
      role="alert"
    >
      {isSuccess ? (
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
      )}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ProfileSettings = () => {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
  };

  // ── Display name ──────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [displayNameError, setDisplayNameError] = useState('');
  const [displayNameLoading, setDisplayNameLoading] = useState(false);

  const handleUpdateDisplayName = async (e) => {
    e.preventDefault();
    const err = validateDisplayName(displayName);
    if (err) { setDisplayNameError(err); return; }

    setDisplayNameLoading(true);
    try {
      await updateUserProfile(currentUser.uid, { displayName: sanitizeInput(displayName) });
      await refreshProfile();
      showToast('Display name updated successfully.');
    } catch {
      showToast('Failed to update display name.', 'error');
    } finally {
      setDisplayNameLoading(false);
    }
  };

  // ── Profile photo ─────────────────────────────────────────────────────────
  const photoInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const handlePhotoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setPhotoLoading(true);
    try {
      const url = await uploadProfilePhoto(currentUser.uid, photoFile);
      await updateUserProfile(currentUser.uid, { photoURL: url });
      await refreshProfile();
      setPhotoFile(null);
      showToast('Profile photo updated.');
    } catch {
      showToast('Failed to upload photo.', 'error');
    } finally {
      setPhotoLoading(false);
    }
  };

  // ── Course selection ──────────────────────────────────────────────────────
  const [selectedCourses, setSelectedCourses] = useState(userProfile?.courses || []);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseError, setCourseError] = useState('');

  const toggleCourse = (code) => {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
    setCourseError('');
  };

  const handleUpdateCourses = async (e) => {
    e.preventDefault();
    if (selectedCourses.length < 3) {
      setCourseError('Please select at least 3 courses.');
      return;
    }
    setCoursesLoading(true);
    try {
      await updateUserProfile(currentUser.uid, { courses: selectedCourses });
      await refreshProfile();
      showToast('Course selection updated.');
    } catch {
      showToast('Failed to update courses.', 'error');
    } finally {
      setCoursesLoading(false);
    }
  };

  // ── Password change ───────────────────────────────────────────────────────
  const [pwData, setPwData] = useState({ newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    const { valid, errors: pwValidationErrors } = validatePassword(pwData.newPassword);
    if (!valid) errs.newPassword = pwValidationErrors[0];
    const confirmErr = validateConfirmPassword(pwData.newPassword, pwData.confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;

    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }

    setPwLoading(true);
    try {
      await updateUserPassword(pwData.newPassword);
      setPwData({ newPassword: '', confirmPassword: '' });
      setPwErrors({});
      showToast('Password updated successfully.');
    } catch (err) {
      const msg = getFirebaseErrorMessage(err.code);
      showToast(msg, 'error');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch {
      setSignOutLoading(false);
      showToast('Failed to sign out.', 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'success' })} />

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>

        {/* Account Information (read-only) */}
        <Section title="Account Information">
          <dl className="space-y-3">
            {[
              { label: 'Email', value: currentUser?.email },
              { label: 'University', value: userProfile?.university },
              { label: 'Department', value: userProfile?.department },
              { label: 'Level', value: userProfile?.level ? `${userProfile.level} Level` : '' },
              { label: 'Matric Number', value: userProfile?.matricNumber || 'Not provided' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-900 text-right ml-4">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Profile Photo */}
        <Section title="Profile Photo">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-blue-500">
                  {(userProfile?.displayName || currentUser?.email || '?')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoFileChange}
                className="sr-only"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Choose Photo
                </button>
                {photoFile && (
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={photoLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition"
                  >
                    {photoLoading ? (
                      <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                    ) : 'Save Photo'}
                  </button>
                )}
              </div>
              {photoFile && (
                <p className="text-xs text-gray-500 mt-1.5">New photo selected — click Save to apply.</p>
              )}
            </div>
          </div>
        </Section>

        {/* Display Name */}
        <Section title="Display Name">
          <form onSubmit={handleUpdateDisplayName} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (displayNameError) setDisplayNameError('');
                }}
                className={`block w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  displayNameError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Your display name"
                maxLength={50}
              />
              {displayNameError && (
                <p className="mt-1 text-xs text-red-600">{displayNameError}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={displayNameLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition flex-shrink-0"
            >
              {displayNameLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Save'}
            </button>
          </form>
        </Section>

        {/* Course Selection */}
        <Section title="Course Selection">
          <form onSubmit={handleUpdateCourses} className="space-y-3">
            {courseError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{courseError}</p>
            )}
            <div className="space-y-2">
              {CS_400_COURSES.map(({ code, label }) => {
                const isSelected = selectedCourses.includes(code);
                return (
                  <label
                    key={code}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourse(code)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">
                {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected
              </p>
              <button
                type="submit"
                disabled={coursesLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition"
              >
                {coursesLoading ? (
                  <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                ) : 'Update Courses'}
              </button>
            </div>
          </form>
        </Section>

        {/* Change Password */}
        <Section title="Change Password">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPw ? 'text' : 'password'}
                  value={pwData.newPassword}
                  onChange={(e) => {
                    setPwData((p) => ({ ...p, newPassword: e.target.value }));
                    if (pwErrors.newPassword) setPwErrors((p) => ({ ...p, newPassword: '' }));
                  }}
                  className={`block w-full px-3 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    pwErrors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNewPw((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showNewPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {pwErrors.newPassword && <p className="mt-1.5 text-xs text-red-600">{pwErrors.newPassword}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={pwData.confirmPassword}
                  onChange={(e) => {
                    setPwData((p) => ({ ...p, confirmPassword: e.target.value }));
                    if (pwErrors.confirmPassword) setPwErrors((p) => ({ ...p, confirmPassword: '' }));
                  }}
                  className={`block w-full px-3 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    pwErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  {showConfirmPw ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {pwErrors.confirmPassword && <p className="mt-1.5 text-xs text-red-600">{pwErrors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition"
            >
              {pwLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating…</>
              ) : 'Update Password'}
            </button>

            <p className="text-xs text-gray-400">
              If you get a "requires recent login" error, sign out and sign back in first.
            </p>
          </form>
        </Section>

        {/* Sign out */}
        <Section title="Account Actions">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Sign out</p>
              <p className="text-xs text-gray-500 mt-0.5">Sign out of your StudyHub account</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 font-medium rounded-lg text-sm transition"
            >
              {signOutLoading ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
              )}
              Sign Out
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default ProfileSettings;
