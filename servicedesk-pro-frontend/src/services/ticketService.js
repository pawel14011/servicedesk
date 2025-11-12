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

// Zmień przypisanie ticket'u (Manager)
export const reassignTicket = async (ticketId, newTechnicianId, managerId) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    const reassignmentHistory = ticketSnap.data().reassignmentHistory || [];

    await updateDoc(ticketRef, {
      technicianId: newTechnicianId,
      reassignmentHistory: [
        ...reassignmentHistory,
        {
          oldTechnicianId: ticketSnap.data().technicianId,
          newTechnicianId: newTechnicianId,
          reassignedBy: managerId,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    console.log(`✅ Ticket ${ticketId} reassigned to ${newTechnicianId}`);
  } catch (error) {
    console.error('Error reassigning ticket:', error);
    throw error;
  }
};

// Pobierz statystyki technika (ilość otwartych ticketów)
export const getTechnicianStats = async (technicianId) => {
  try {
    const q = query(
      collection(db, 'tickets'),
      where('technicianId', '==', technicianId),
      where('status', '!=', 'Closed')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length;
  } catch (error) {
    console.error('Error fetching technician stats:', error);
    throw error;
  }
};

// Pobierz statystyki ticketów
export const getTicketStats = async () => {
  try {
    const allTickets = await getDocs(collection(db, 'tickets'));
    const tickets = allTickets.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const stats = {
      total: tickets.length,
      registered: tickets.filter((t) => t.status === 'Registered').length,
      received: tickets.filter((t) => t.status === 'Received').length,
      diagnosed: tickets.filter((t) => t.status === 'Diagnosed').length,
      repairing: tickets.filter((t) => t.status === 'Repairing').length,
      ready: tickets.filter((t) => t.status === 'Ready').length,
      closed: tickets.filter((t) => t.status === 'Closed').length,
      open: tickets.filter((t) => t.status !== 'Closed').length,
    };

    return { stats, tickets };
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw error;
  }
};

// Oblicz średni czas naprawy
export const calculateAverageRepairTime = (tickets) => {
  const closedTickets = tickets.filter((t) => t.status === 'Closed');

  if (closedTickets.length === 0) return 0;

  const totalTime = closedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const statusHistory = ticket.statusHistory || [];
    const closed = statusHistory.find((s) => s.status === 'Closed');

    if (closed) {
      const closedDate = new Date(closed.timestamp);
      return sum + (closedDate - created);
    }
    return sum;
  }, 0);

  const averageMs = totalTime / closedTickets.length;
  const averageDays = averageMs / (1000 * 60 * 60 * 24);

  return parseFloat(averageDays.toFixed(2));
};

// Pobierz statystyki części
export const getPartsStatistics = async () => {
  try {
    const allTickets = await getDocs(collection(db, 'tickets'));
    const partsCount = {};

    allTickets.docs.forEach((doc) => {
      const parts = doc.data().ticketParts || [];
      parts.forEach((part) => {
        const key = `${part.description} (${part.manufacturer})`;
        partsCount[key] = (partsCount[key] || 0) + 1;
      });
    });

    // Sortuj malejąco
    const sorted = Object.entries(partsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10

    return sorted;
  } catch (error) {
    console.error('Error fetching parts statistics:', error);
    throw error;
  }
};

// Statystyki per technik
export const getTechnicianPerformance = async () => {
  try {
    const allTickets = await getDocs(collection(db, 'tickets'));
    const techStats = {};

    allTickets.docs.forEach((doc) => {
      const ticket = doc.data();
      const techId = ticket.technicianId;

      if (!techStats[techId]) {
        techStats[techId] = {
          total: 0,
          closed: 0,
          open: 0,
        };
      }

      techStats[techId].total++;
      if (ticket.status === 'Closed') {
        techStats[techId].closed++;
      } else {
        techStats[techId].open++;
      }
    });

    return techStats;
  } catch (error) {
    console.error('Error fetching technician performance:', error);
    throw error;
  }
};

// Dodaj zdjęcie do ticketu
export const addImageToTicket = async (ticketId, imageData) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const images = ticketSnap.data().images || [];

    await updateDoc(ticketRef, {
      images: [...images, imageData],
    });

    console.log('✅ Image added to ticket');
  } catch (error) {
    console.error('Error adding image to ticket:', error);
    throw error;
  }
};

// Usuń zdjęcie z ticketu
export const removeImageFromTicket = async (ticketId, imagePath) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);
    const images = ticketSnap.data().images || [];

    const updatedImages = images.filter((img) => img.path !== imagePath);

    await updateDoc(ticketRef, {
      images: updatedImages,
    });

    console.log('✅ Image removed from ticket');
  } catch (error) {
    console.error('Error removing image from ticket:', error);
    throw error;
  }
};
