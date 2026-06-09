// Firebase Authentication helper functions for StudyHub

import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  updatePassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  reload,
} from 'firebase/auth';

/**
 * Registers a new user with email and password.
 * Sends a verification email immediately after account creation.
 * @returns {firebase.User} The newly created user object
 */
export const registerUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user);
  return userCredential.user;
};

/**
 * Logs in an existing user. Sets persistence based on "remember me".
 * - rememberMe=true  → persists across browser sessions (localStorage)
 * - rememberMe=false → cleared when tab closes (sessionStorage)
 * @returns {firebase.User}
 */
export const loginUser = async (email, password, rememberMe = true) => {
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  await setPersistence(auth, persistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Signs out the current user.
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Resends the email verification to the currently logged-in user.
 */
export const resendVerificationEmail = async () => {
  if (!auth.currentUser) throw new Error('No user is currently signed in.');
  await sendEmailVerification(auth.currentUser);
};

/**
 * Sends a password reset email to the given address.
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Updates the current user's password. Requires recent login.
 * Throws 'auth/requires-recent-login' if session is stale.
 */
export const updateUserPassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error('No user is currently signed in.');
  await updatePassword(auth.currentUser, newPassword);
};

/**
 * Reloads the current user's auth data from Firebase.
 * Use this after the user verifies their email to pick up the updated emailVerified flag.
 * @returns {firebase.User} The refreshed user object
 */
export const refreshCurrentUser = async () => {
  if (!auth.currentUser) throw new Error('No user is currently signed in.');
  await reload(auth.currentUser);
  return auth.currentUser;
};

/**
 * Maps Firebase auth error codes to user-friendly messages.
 * @param {string} errorCode - Firebase error code (e.g. 'auth/wrong-password')
 * @returns {string} User-friendly error message
 */
export const getFirebaseErrorMessage = (errorCode) => {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/requires-recent-login': 'For security, please sign out and sign back in before changing your password.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  };
  return messages[errorCode] || 'An unexpected error occurred. Please try again.';
};
