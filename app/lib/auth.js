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

    // Handle referral reward securely via API
    if (referralCode) {
      try {
        await fetch("/api/referral/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode, newUserId: uid })
        });
      } catch (err) {
        console.error("Referral award failed:", err);
      }
    }

    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const loginWithGoogle = async (referralCode = null) => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    
    // Check if user doc exists
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Initialize new user
      const newUser = {
        uid: user.uid,
        email: user.email,
        display_name: user.displayName,
        plan: 'free',
        credits_remaining: 3,
        generations_total: 0,
        referral_code: nanoid(6).toUpperCase(),
        referred_by: referralCode,
        created_at: new Date(),
        last_active: new Date(),
        abuse_score: 0
      };
      await setDoc(userDocRef, newUser);

      // Handle referral reward securely via API
      if (referralCode) {
        try {
          await fetch("/api/referral/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode, newUserId: user.uid })
          });
        } catch (err) {
          console.error("Referral award failed:", err);
        }
      }
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, signup, logout, resetPassword, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
