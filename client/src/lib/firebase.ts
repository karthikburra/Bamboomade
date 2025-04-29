import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { apiRequest } from "./queryClient";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Google provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google
 * @returns Promise with user credentials
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Get ID token
    const idToken = await user.getIdToken();
    
    // Send the token to our backend to create or update the user
    await apiRequest("POST", "/api/auth/google", {
      idToken
    });
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Sign out from Firebase
 */
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
    // Call our logout endpoint to clear the session
    await apiRequest("POST", "/api/auth/logout", {});
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};