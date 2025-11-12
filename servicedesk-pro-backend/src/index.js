require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { db } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend running ✅' });
});

// Test Firestore: Pobierz wszystkie tickety
app.get('/api/tickets', async (req, res) => {
  try {
    const snapshot = await db.collection('tickets').get();
    const tickets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ tickets });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Test Firestore: Dodaj ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { description } = req.body;
    const docRef = await db.collection('tickets').add({
      ticketNumber: `TKT-${Date.now()}`,
      description: description || 'No description',
      status: 'Registered',
      createdAt: new Date().toISOString(),
    });
    res.json({ id: docRef.id, message: 'Ticket created' });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
