"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
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
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const uid = res.user.uid;
    
    // Create User Document
    const newUser = {
      uid,
      email,
      plan: 'free',
      credits_remaining: 3,
      generations_total: 0,
      referral_code: nanoid(6).toUpperCase(),
      referred_by: referralCode,
      created_at: new Date(),
      last_active: new Date(),
      abuse_score: 0
    };

    await setDoc(doc(db, "users", uid), newUser);

    // If referred, handle referral reward (simplified - should be on backend for security)
    if (referralCode) {
      // In production, use a Cloud Function to securely increment referrer's credits
      // and log the referral event.
    }

    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
