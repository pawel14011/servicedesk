
import { collection, getDocs, query, where, doc, getDoc, setDoc,updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Pobierz wszystkich użytkowników
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Pobierz użytkowników według roli
export const getUsersByRole = async (role) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

// Pobierz dane użytkownika
export const getUserDetails = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

// Utwórz użytkownika z kontem authentication (dla worker, technician, manager)
export const createUserWithAccount = async (userData, password) => {
  try {
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    const { auth } = await import('../config/firebase');

    if (!userData.email || !password) {
      throw new Error('Email i hasło są wymagane do utworzenia konta');
    }

    // Utwórz konto authentication
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
    const newUser = userCredential.user;

    // Utwórz profil w Firestore
    const userRef = doc(db, 'users', newUser.uid);
    await setDoc(userRef, {
      uid: newUser.uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role || 'client',
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy,
      hasAccount: true,
      active: true,
    });

    console.log('✅ User with account created:', newUser.uid);
    return newUser.uid;
  } catch (error) {
    console.error('Error creating user with account:', error);
    throw error;
  }
};

// Utwórz użytkownika (tylko dane kontaktowe, bez authentication)
export const createUserProfile = async (userData) => {
  try {
    // Generujemy unikalny ID dla użytkownika
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      uid: userId,
      email: userData.email || '',
      fullName: userData.fullName,
      role: userData.role || 'client',
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
      createdBy: userData.createdBy, // UID Worker'a
      hasAccount: false, // Nie ma konta authentication
      active: true,
    });

    console.log('✅ User profile created:', userId);
    return userId;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};


// Zaktualizuj użytkownika
export const updateUser = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updateData);
    console.log('✅ User updated:', userId);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Usuń użytkownika
export const deleteUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    console.log('✅ User deleted:', userId);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Zmień rolę użytkownika
export const changeUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role: newRole });
    console.log(`✅ User ${userId} role changed to ${newRole}`);
  } catch (error) {
    console.error('Error changing user role:', error);
    throw error;
  }
};

// Deaktywuj użytkownika
export const deactivateUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { active: false });
    console.log('✅ User deactivated:', userId);
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

// Aktywuj użytkownika
export const activateUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { active: true });
    console.log('✅ User activated:', userId);
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};