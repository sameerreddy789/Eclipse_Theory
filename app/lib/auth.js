"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User 
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { nanoid } from "nanoid";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Setup real-time listener for user data (credits, plan, etc)
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // New user initialization is usually handled on signup
            // but we keep a fallback here
            console.log("No user data found in Firestore");
          }
          setLoading(false);
        });

        return () => unsubDoc();
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email, password, referralCode = null) => {
    if (!auth || !db) throw new Error("Firebase not initialized. Check your API keys.");
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // ... rest
  };

  const login = (email, password) => {
    if (!auth) throw new Error("Firebase not initialized");
    return signInWithEmailAndPassword(auth, email, password);
  };
  const logout = () => auth && signOut(auth);
  const resetPassword = (email) => {
    if (!auth) throw new Error("Firebase not initialized");
    return sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async (referralCode = null) => {
    if (!auth || !db) throw new Error("Firebase not initialized");
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    // ... rest
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout, resetPassword, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
