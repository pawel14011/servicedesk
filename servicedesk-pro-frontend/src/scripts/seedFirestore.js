import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

// password123

// Seed'owanie użytkowników
const seedUsers = async () => {
  const users = [
    {
      uid: 'BvRLnfwBuesHp986vVuJbkZmsZ6u',
      email: 'client@example.com',
      fullName: 'Jan Kowalski',
      role: 'client',
      phone: '123456789',
      createdAt: new Date().toISOString(),
    },
    {
      uid: 'CZ2Cr8wrayOWNNRhsWTblN6zDrNC',
      email: 'worker@example.com',
      fullName: 'Maria Nowak',
      role: 'worker',
      phone: '987654321',
      createdAt: new Date().toISOString(),
    },
    {
      uid: 'Ub2n9iQVpsR9qns6Mg7vNkld1vUU',
      email: 'technician@example.com',
      fullName: 'Piotr Lewandowski',
      role: 'technician',
      phone: '555666777',
      createdAt: new Date().toISOString(),
    },
    {
      uid: 'NEOZpF0MjrOP1gqJ6Xmz2isIlGd6',
      email: 'technician2@example.com',
      fullName: 'Anna Kowalczyk',
      role: 'technician',
      phone: '555888999',
      createdAt: new Date().toISOString(),
    },
    {
      uid: '2yrHzSETrnugPkc6hDD1d209j7Pp',
      email: 'manager@example.com',
      fullName: 'Krzysztof Szpak',
      role: 'manager',
      phone: '111222333',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    try {
      await setDoc(doc(db, 'users', user.uid), user);
      console.log(`✅ User created: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error creating user: ${user.email}`, error);
    }
  }
};

// Seed'owanie urządzeń
const seedDevices = async () => {
  const devices = [
    {
      deviceId: 'device-1',
      serialNumber: 'SN-12345678',
      brand: 'Dell',
      model: 'XPS 13',
      yearProduction: 2022,
      ownerId: 'user-client-1',
      warrantyStatus: 'active',
      warrantyExpireDate: '2026-12-31',
      photos: [],
      repairHistory: [],
      createdAt: new Date().toISOString(),
    },
    {
      deviceId: 'device-2',
      serialNumber: 'SN-87654321',
      brand: 'Apple',
      model: 'MacBook Pro',
      yearProduction: 2021,
      ownerId: 'user-client-1',
      warrantyStatus: 'expired',
      warrantyExpireDate: '2023-06-30',
      photos: [],
      repairHistory: [],
      createdAt: new Date().toISOString(),
    },
    {
      deviceId: 'device-3',
      serialNumber: 'SN-11111111',
      brand: 'HP',
      model: 'Pavilion',
      yearProduction: 2023,
      ownerId: 'user-client-1',
      warrantyStatus: 'active',
      warrantyExpireDate: '2025-11-12',
      photos: [],
      repairHistory: [],
      createdAt: new Date().toISOString(),
    },
  ];

  for (const device of devices) {
    try {
      await setDoc(doc(db, 'devices', device.deviceId), device);
      console.log(`✅ Device created: ${device.serialNumber}`);
    } catch (error) {
      console.error(`❌ Error creating device: ${device.serialNumber}`, error);
    }
  }
};

// Seed'owanie ticketów
const seedTickets = async () => {
  const tickets = [
    {
      ticketNumber: 'TKT-2025-001',
      clientId: 'user-client-1',
      deviceId: 'device-1',
      technicianId: 'user-technician-1',
      status: 'Received',
      description: 'Ekran nie reaguje na dotyk',
      imageUrl: '',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Registered',
          timestamp: new Date().toISOString(),
          changedBy: 'user-worker-1',
        },
        {
          status: 'Received',
          timestamp: new Date().toISOString(),
          changedBy: 'user-worker-1',
        },
      ],
    },
    {
      ticketNumber: 'TKT-2025-002',
      clientId: 'user-client-1',
      deviceId: 'device-2',
      technicianId: 'user-technician-2',
      status: 'Diagnosed',
      description: 'Brak zasilania',
      imageUrl: '',
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'Registered',
          timestamp: new Date().toISOString(),
          changedBy: 'user-worker-1',
        },
        {
          status: 'Received',
          timestamp: new Date().toISOString(),
          changedBy: 'user-technician-2',
        },
        {
          status: 'Diagnosed',
          timestamp: new Date().toISOString(),
          changedBy: 'user-technician-2',
        },
      ],
    },
  ];

  for (const ticket of tickets) {
    try {
      const docRef = await addDoc(collection(db, 'tickets'), ticket);
      console.log(`✅ Ticket created: ${ticket.ticketNumber}`);
    } catch (error) {
      console.error(`❌ Error creating ticket: ${ticket.ticketNumber}`, error);
    }
  }
};

// Główna funkcja
export const seedAllData = async () => {
  console.log('🌱 Starting data seeding...');
  try {
    await seedUsers();
    console.log('\n');
    await seedDevices();
    console.log('\n');
    await seedTickets();
    console.log('\n✅ All data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
  console.log('\n🔐 Demo Passwords (ONLY FOR LOCAL DEV):');
  console.log('All demo users: password123');
};
