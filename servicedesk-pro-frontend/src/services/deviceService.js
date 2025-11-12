import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Pobierz wszystkie urządzenia
export const getAllDevices = async () => {
  try {
    const q = query(collection(db, 'devices'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const devices = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return devices;
  } catch (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }
};

// Pobierz urządzenia danego właściciela
export const getClientDevices = async (clientId) => {
  try {
    const q = query(
      collection(db, 'devices'),
      where('ownerId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const devices = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return devices;
  } catch (error) {
    console.error('Error fetching client devices:', error);
    throw error;
  }
};

// Pobierz szczegóły urządzenia
export const getDeviceDetails = async (deviceId) => {
  try {
    const docRef = doc(db, 'devices', deviceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Device not found');
    }
  } catch (error) {
    console.error('Error fetching device details:', error);
    throw error;
  }
};

// Utwórz nowe urządzenie
export const createDevice = async (deviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'devices'), {
      ...deviceData,
      createdAt: new Date().toISOString(),
      repairHistory: [],
      photos: [],
    });
    console.log('✅ Device created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating device:', error);
    throw error;
  }
};

// Powiąż ticket z urządzeniem (dodaj do historii)
export const linkTicketToDevice = async (deviceId, ticketId) => {
  try {
    const deviceRef = doc(db, 'devices', deviceId);
    const deviceSnap = await getDoc(deviceRef);
    const repairHistory = deviceSnap.data().repairHistory || [];

    await updateDoc(deviceRef, {
      repairHistory: [...repairHistory, ticketId],
    });

    console.log(`✅ Ticket ${ticketId} linked to device ${deviceId}`);
  } catch (error) {
    console.error('Error linking ticket to device:', error);
    throw error;
  }
};

// Utwórz lub pobierz urządzenie po numerze seryjnym
export const findOrCreateDeviceBySerial = async (serialNumber, deviceData, clientId) => {
  try {
    // Szukaj urządzenia po numerze seryjnym
    const q = query(collection(db, 'devices'), where('serialNumber', '==', serialNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.docs.length > 0) {
      // Znaleziono — zwróć ID
      return querySnapshot.docs[0].id;
    } else {
      // Nie znaleziono — utwórz nowe
      const docRef = await addDoc(collection(db, 'devices'), {
        ...deviceData,
        ownerId: clientId,
        createdAt: new Date().toISOString(),
        repairHistory: [],
        photos: [],
      });
      return docRef.id;
    }
  } catch (error) {
    console.error('Error finding/creating device:', error);
    throw error;
  }
};

// Aktualizuj dane urządzenia
export const updateDevice = async (deviceId, updateData) => {
  try {
    const deviceRef = doc(db, 'devices', deviceId);
    await updateDoc(deviceRef, updateData);
    console.log(`✅ Device ${deviceId} updated`);
  } catch (error) {
    console.error('Error updating device:', error);
    throw error;
  }
};

// Pobierz historię napraw dla urządzenia (z detałami ticketów)
export const getDeviceRepairHistory = async (deviceId) => {
  try {
    const device = await getDeviceDetails(deviceId);
    const repairHistory = device.repairHistory || [];

    const ticketsData = [];
    for (const ticketId of repairHistory) {
      try {
        const ticketSnap = await getDoc(doc(db, 'tickets', ticketId));
        if (ticketSnap.exists()) {
          ticketsData.push({
            id: ticketSnap.id,
            ...ticketSnap.data(),
          });
        }
      } catch (err) {
        console.warn(`Could not fetch ticket ${ticketId}:`, err);
      }
    }

    return ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error fetching repair history:', error);
    throw error;
  }
};
