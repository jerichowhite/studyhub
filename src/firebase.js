import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDJI7-uLNdcbytc8kdK2ByjguGLNS6bVNo",
  authDomain: "studyhub-726a4.firebaseapp.com",
  databaseURL: "https://studyhub-726a4-default-rtdb.firebaseio.com",
  projectId: "studyhub-726a4",
  storageBucket: "studyhub-726a4.firebasestorage.app",
  messagingSenderId: "516267720425",
  appId: "1:516267720425:web:adebd116455dbe4babfa78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const realtimeDb = getDatabase(app);

export default app;