import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const COURSES_LIST = [
  "CSC 411 - Artificial Intelligence",
  "CSC 413 - Database Design",
  "CSC 415 - Systems Analysis",
  "MTH 401 - Advanced Calculus",
  "PHY 401 - Quantum Mechanics",
  "ENG 401 - Engineering Math"
];

const Toast = ({ message, type }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl animate-in fade-in flex items-center gap-2 ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
      <span className="font-bold">{isError ? 'Error: ' : 'Success: '}</span> {message}
    </div>
  );
};

const Profile = () => {
  const { currentUser, userProfile: userData } = useAuth();
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
    displayName: '',
    university: 'Benson Idahosa University',
    department: '',
    level: '',
    courses: [],
    matricNumber: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMsg, setToastMsg] = useState({ message: '', type: '' });
  
  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg({ message: '', type: '' }), 4000);
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        university: userData.university || 'Benson Idahosa University',
        department: userData.department || '',
        level: userData.level || '',
        courses: userData.courses || [],
        matricNumber: userData.matricNumber || ''
      });
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (course) => {
    setFormData(prev => {
      const isSelected = prev.courses.includes(course);
      if (isSelected) {
        return { ...prev, courses: prev.courses.filter(c => c !== course)};
      } else {
        return { ...prev, courses: [...prev.courses, course]};
      }
    });
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: formData.displayName,
        university: formData.university,
        department: formData.department,
        level: formData.level,
        courses: formData.courses,
        matricNumber: formData.matricNumber,
        updatedAt: serverTimestamp()
      });
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Max 2MB checking
    if (file.size > 2 * 1024 * 1024) {
      showToast('File is too large (Max 2MB)', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Only JPG and PNG files are allowed', 'error');
      return;
    }

    setUploading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `profilePhotos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        photoURL: photoURL,
        updatedAt: serverTimestamp()
      });

      showToast('Profile photo updated successfully!');
      // Assuming a reload or context refetch triggers updating the avatar globally
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      showToast('Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentUser?.email) return;
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, currentUser.email);
      showToast('Password reset email sent. Check your inbox.');
    } catch (error) {
      console.error(error);
      showToast('Failed to send reset email', 'error');
    }
  };

  // Stats derivations
  const points = userData?.points || 0;
  const currentLevel = userData?.aiPreferences?.level || Math.floor(points / 100) + 1; // Arbitrary logic if level isn't fixed
  const studyStreak = userData?.stats?.studyStreak || 0;
  const materialsUploaded = userData?.stats?.materialsUploaded || 0;
  
  const accountSinceDate = currentUser?.metadata?.creationTime 
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString() 
    : 'Unknown';

  const userPhoto = currentUser?.photoURL || null;
  const defaultInitial = formData.displayName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">My Profile</h1>
      
      <Toast message={toastMsg.message} type={toastMsg.type} />

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-2/5 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center">
            
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-[120px] h-[120px] rounded-full bg-blue-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-blue-700 text-4xl shrink-0 overflow-hidden">
                {uploading ? (
                   <span className="animate-pulse text-sm">Uploading...</span>
                ) : userPhoto ? (
                  <img src={userPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  defaultInitial
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold">Change</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg, image/png" 
                onChange={handlePhotoUpload} 
              />
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{formData.displayName || 'Unnamed User'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{currentUser?.email}</p>

            <button
              onClick={handleChangePassword}
              className="w-full py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Change Password
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Account Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Total Points</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{points} pts</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Rank Level</span>
                <span className="font-bold text-gray-800 dark:text-white">Lv. {currentLevel}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Study Streak</span>
                <span className="font-bold text-orange-500">{studyStreak} days</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Materials Uploaded</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{materialsUploaded} files</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium">Account Since</span>
                <span className="font-semibold text-gray-800 dark:text-white">{accountSinceDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-3/5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Edit Profile Info</h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
              <input 
                type="text" 
                name="displayName"
                required
                value={formData.displayName} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                placeholder="E.g., Jane Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">University</label>
                <select 
                  name="university"
                  value={formData.university}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                >
                  <option value="Benson Idahosa University">Benson Idahosa University</option>
                  <option value="University of Benin">University of Benin</option>
                  <option value="Covenant University">Covenant University</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Matriculation Number</label>
                <input 
                  type="text" 
                  name="matricNumber"
                  value={formData.matricNumber} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                <select 
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Law">Law</option>
                  <option value="Medicine">Medicine</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Level</label>
                <select 
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                >
                  <option value="">Select Level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enrolled Courses</label>
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl max-h-64 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-700/50">
                {COURSES_LIST.map((course) => (
                  <label key={course} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600 shadow-sm">
                    <input
                      type="checkbox"
                      checked={formData.courses.includes(course)}
                      onChange={() => handleCourseChange(course)}
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-700 dark:text-gray-200 text-sm font-medium">{course}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button 
                type="submit"
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center justify-center min-w-[150px] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <span className="animate-pulse">Saving...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
            
          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;
