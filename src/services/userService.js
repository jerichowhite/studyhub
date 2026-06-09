// Firestore user profile CRUD operations for StudyHub

import { db, storage } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Creates a minimal user document in Firestore at users/{userId}.
 * Called immediately after email/password registration.
 */
export const initUserProfile = async (userId, email) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email,
    emailVerified: false,
    profileCompleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Fetches the full user profile document.
 * @returns {Object|null} Profile data with id, or null if not found
 */
export const getUserProfile = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

/**
 * Partially updates a user profile. Merges with existing data.
 * Always sets updatedAt to now.
 */
export const updateUserProfile = async (userId, data) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Saves the completed multi-step profile and marks it as done.
 * Uses merge:true so partial writes during setup steps don't wipe other fields.
 */
export const completeUserProfile = async (userId, profileData) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      ...profileData,
      profileCompleted: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Uploads a profile photo to Firebase Storage and returns its download URL.
 * Stored at profile-photos/{userId} (overwrites previous photo).
 * @param {string} userId
 * @param {File} file - The image file to upload
 * @returns {string} Public download URL
 */
export const uploadProfilePhoto = async (userId, file) => {
  const storageRef = ref(storage, `profile-photos/${userId}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};
