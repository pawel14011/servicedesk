import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Tworzymy Context
const AuthContext = createContext(null);

// Provider komponenty
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ustawiamy Firebase aby pamiętał sesję
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence);
  }, []);

  // Słuchamy zmian stanu autentykacji
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // Pobieramy rolę z Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
            console.log(`✅ Zalogowany: ${currentUser.email} (${userDoc.data().role})`);
          }
        } else {
          setUser(null);
          setUserRole(null);
          console.log('✅ Wylogowany');
        }
      } catch (err) {
        console.error('❌ Error fetching user role:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Funkcja do rejestracji
  const register = async (email, password, fullName, role = 'client', phone = '') => {
    setError(null);
    try {
      setLoading(true);
      // Tworzymy użytkownika w Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Tworzymy dokument użytkownika w Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: email,
        fullName: fullName,
        role: role,
        phone: phone,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Użytkownik ${email} zarejestrowany jako ${role}`);
      setUser(newUser);
      setUserRole(role);
      return newUser;
    } catch (err) {
      console.error('❌ Error registering user:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do logowania
  const login = async (email, password) => {
    setError(null);
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedUser = userCredential.user;

      // Pobieramy rolę z Firestore
      const userDoc = await getDoc(doc(db, 'users', loggedUser.uid));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
        console.log(`✅ Zalogowany: ${email} (${userDoc.data().role})`);
      }

      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      console.error('❌ Error logging in:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do wylogowania
  const logout = async () => {
    setError(null);
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
      setUserRole(null);
      console.log('✅ Wylogowano');
    } catch (err) {
      console.error('❌ Error logging out:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userRole,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook do użycia AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  }
  return context;
};
