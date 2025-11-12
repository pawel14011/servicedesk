import { collection, getDocs, query, where, doc, getDoc, setDoc } from 'firebase/firestore';
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
    });

    console.log('✅ User profile created:', userId);
    return userId;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};
