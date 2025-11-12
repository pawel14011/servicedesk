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

// Generowanie unikalnego numeru ticketu
export const generateTicketNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now();
  return `TKT-${year}-${timestamp}`;
};

// Pobierz wszystkie tickety
export const getAllTickets = async () => {
  try {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return tickets;
  } catch (error) {
    console.error('Error fetching tickets:', error);
    throw error;
  }
};

// Pobierz tickety dla konkretnego klienta
export const getClientTickets = async (clientId) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return tickets;
  } catch (error) {
    console.error('Error fetching client tickets:', error);
    throw error;
  }
};

// Pobierz tickety przypisane do technika
export const getTechnicianTickets = async (technicianId) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('technicianId', '==', technicianId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const tickets = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return tickets;
  } catch (error) {
    console.error('Error fetching technician tickets:', error);
    throw error;
  }
};

// Pobierz szczegóły ticketu
export const getTicketDetails = async (ticketId) => {
  try {
    const docRef = doc(db, 'tickets', ticketId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Ticket not found');
    }
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    throw error;
  }
};

// Utwórz nowy ticket
export const createTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(collection(db, 'tickets'), {
      ...ticketData,
      ticketNumber: generateTicketNumber(),
      status: 'Registered',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Registered',
          timestamp: new Date().toISOString(),
          changedBy: ticketData.clientId || 'unknown',
        },
      ],
    });
    console.log('✅ Ticket created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

// Zmień status ticketu
export const updateTicketStatus = async (ticketId, newStatus, userId) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const currentStatusHistory = ticketSnap.data().statusHistory || [];

    await updateDoc(ticketRef, {
      status: newStatus,
      statusHistory: [
        ...currentStatusHistory,
        {
          status: newStatus,
          timestamp: new Date().toISOString(),
          changedBy: userId,
        },
      ],
    });
    console.log(`✅ Ticket ${ticketId} updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

// Przypisz ticket do technika
export const assignTicketToTechnician = async (ticketId, technicianId, assignedBy) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      technicianId: technicianId,
      assignedAt: new Date().toISOString(),
      assignedBy: assignedBy,
    });
    console.log(`✅ Ticket ${ticketId} assigned to technician ${technicianId}`);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
};

// Pobierz technikanów z najmniejszym obciążeniem
export const getTechnicianWithLeastLoad = async () => {
  try {
    const q = query(collection(db, 'tickets'), where('status', '!=', 'Closed'));
    const allTickets = await getDocs(q);

    const technicianLoad = {};
    allTickets.docs.forEach((doc) => {
      const techId = doc.data().technicianId;
      if (techId) {
        technicianLoad[techId] = (technicianLoad[techId] || 0) + 1;
      }
    });

    // Pobierz wszystkich techników
    const q2 = query(collection(db, 'users'), where('role', '==', 'technician'));
    const techSnap = await getDocs(q2);

    let techWithLeastLoad = null;
    let minLoad = Infinity;

    techSnap.docs.forEach((doc) => {
      const techId = doc.id;
      const load = technicianLoad[techId] || 0;
      if (load < minLoad) {
        minLoad = load;
        techWithLeastLoad = techId;
      }
    });

    return techWithLeastLoad;
  } catch (error) {
    console.error('Error getting technician with least load:', error);
    throw error;
  }
};

// ============= NOTATKI =============

// Dodaj notatkę do ticketu
export const addNoteToTicket = async (ticketId, noteContent, userId, userName) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const notes = ticketSnap.data().notes || [];

    const newNote = {
      id: Date.now().toString(),
      content: noteContent,
      author: userName || userId,
      authorId: userId,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(ticketRef, {
      notes: [...notes, newNote],
    });

    console.log('✅ Note added');
    return newNote;
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

// Pobierz notatki dla ticketu
export const getTicketNotes = async (ticketId) => {
  try {
    const ticketSnap = await getDoc(doc(db, 'tickets', ticketId));
    return ticketSnap.data().notes || [];
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

// ============= CZĘŚCI =============

// Dodaj część do ticketu
export const addPartToTicket = async (ticketId, partData) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const ticketParts = ticketSnap.data().ticketParts || [];

    const newPart = {
      id: Date.now().toString(),
      type: partData.type, // 'installed' | 'removed' | 'ordered'
      description: partData.description,
      sku: partData.sku || '',
      manufacturer: partData.manufacturer || '',
      unitPrice: partData.unitPrice || 0,
      quantity: partData.quantity || 1,
      status: partData.status || 'ordered', // 'ordered' | 'delivered' | 'installed'
      addedAt: new Date().toISOString(),
    };

    await updateDoc(ticketRef, {
      ticketParts: [...ticketParts, newPart],
    });

    console.log('✅ Part added');
    return newPart;
  } catch (error) {
    console.error('Error adding part:', error);
    throw error;
  }
};

// Pobierz części z ticketu
export const getTicketParts = async (ticketId) => {
  try {
    const ticketSnap = await getDoc(doc(db, 'tickets', ticketId));
    return ticketSnap.data().ticketParts || [];
  } catch (error) {
    console.error('Error fetching parts:', error);
    throw error;
  }
};

// Usuń część z ticketu
export const removePartFromTicket = async (ticketId, partId) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const ticketParts = ticketSnap.data().ticketParts || [];

    const updatedParts = ticketParts.filter((p) => p.id !== partId);

    await updateDoc(ticketRef, {
      ticketParts: updatedParts,
    });

    console.log('✅ Part removed');
  } catch (error) {
    console.error('Error removing part:', error);
    throw error;
  }
};

// Zmień status części
export const updatePartStatus = async (ticketId, partId, newStatus) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const ticketParts = ticketSnap.data().ticketParts || [];

    const updatedParts = ticketParts.map((p) =>
      p.id === partId ? { ...p, status: newStatus } : p
    );

    await updateDoc(ticketRef, {
      ticketParts: updatedParts,
    });

    console.log(`✅ Part status updated to ${newStatus}`);
  } catch (error) {
    console.error('Error updating part status:', error);
    throw error;
  }
};
