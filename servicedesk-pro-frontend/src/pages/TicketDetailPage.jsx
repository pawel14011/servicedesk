import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTicketDetails,
  updateTicketStatus,
  addNoteToTicket,
  getTicketNotes,
  addPartToTicket,
  getTicketParts,
  removePartFromTicket,
  updatePartStatus,
} from '../services/ticketService';
import '../styles/ticket-detail.css';

export const TicketDetailPage = () => {
  const { ticketId } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [notes, setNotes] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [newPart, setNewPart] = useState({
    type: 'installed',
    description: '',
    sku: '',
    manufacturer: '',
    unitPrice: 0,
  });

  useEffect(() => {
    fetchAll();
  }, [ticketId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const ticketData = await getTicketDetails(ticketId);
      const notesData = await getTicketNotes(ticketId);
      const partsData = await getTicketParts(ticketId);

      setTicket(ticketData);
      setNotes(notesData);
      setParts(partsData);
      console.log('✅ All data loaded');
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Nie można załadować danych');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Zmienić status na "${newStatus}"?`)) return;

    setUpdating(true);
    try {
      await updateTicketStatus(ticketId, newStatus, user.uid);
      await fetchAll();
    } catch (err) {
      console.error('Error:', err);
      setError('Błąd podczas aktualizacji statusu');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await addNoteToTicket(ticketId, newNote, user.uid, user.email);
      setNewNote('');
      await fetchAll();
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Błąd podczas dodawania notatki');
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!newPart.description.trim()) return;

    try {
      await addPartToTicket(ticketId, newPart);
      setNewPart({
        type: 'installed',
        description: '',
        sku: '',
        manufacturer: '',
        unitPrice: 0,
      });
      await fetchAll();
    } catch (err) {
      console.error('Error adding part:', err);
      setError('Błąd podczas dodawania części');
    }
  };

  const handleRemovePart = async (partId) => {
    if (!window.confirm('Usunąć tę część?')) return;

    try {
      await removePartFromTicket(ticketId, partId);
      await fetchAll();
    } catch (err) {
      console.error('Error removing part:', err);
      setError('Błąd podczas usuwania części');
    }
  };

  const handleUpdatePartStatus = async (partId, newStatus) => {
    try {
      await updatePartStatus(ticketId, partId, newStatus);
      await fetchAll();
    } catch (err) {
      console.error('Error updating part status:', err);
      setError('Błąd podczas aktualizacji statusu części');
    }
  };

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      Registered: ['Received'],
      Received: ['Diagnosed'],
      Diagnosed: ['Waiting for Parts', 'Repairing'],
      'Waiting for Parts': ['Repairing'],
      Repairing: ['Ready'],
      Ready: ['Closed'],
      Closed: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const getStatusColor = (status) => {
    const colors = {
      Registered: '#FFC107',
      Received: '#2196F3',
      Diagnosed: '#9C27B0',
      'Waiting for Parts': '#FF5722',
      Repairing: '#FF9800',
      Ready: '#4CAF50',
      Closed: '#757575',
    };
    return colors[status] || '#999';
  };

  const canChangeStatus =
    userRole === 'manager' ||
    (userRole === 'technician' && ticket?.technicianId === user.uid) ||
    userRole === 'worker';

  const isTechnician = userRole === 'technician' || userRole === 'manager' || userRole === 'worker';

  if (loading) {
    return <div className="ticket-detail-container">Ładowanie...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="ticket-detail-container">
        <p className="error-message">{error || 'Nie znaleziono ticketu'}</p>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Wróć
        </button>
      </div>
    );
  }

  const nextStatuses = getNextStatuses(ticket.status);
  const totalPartsCost = parts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

  return (
    <div className="ticket-detail-container">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Wróć do listy
      </button>

      <div className="ticket-detail-card">
        <div className="ticket-header">
          <div>
            <h2>{ticket.ticketNumber}</h2>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(ticket.status) }}
            >
              {ticket.status}
            </span>
          </div>
          <div className="ticket-meta">
            <p>
              <strong>Data utworzenia:</strong>{' '}
              {new Date(ticket.createdAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="ticket-sections">
          {/* Opisannie */}
          <section className="ticket-section">
            <h3>📋 Opis problemu</h3>
            <p className="description">{ticket.description}</p>
          </section>

          {/* Urządzenie */}
          <section className="ticket-section">
            <h3>🖥️ Urządzenie</h3>
            <div className="device-info">
              <p>
                <strong>Marka:</strong> {ticket.device?.brand || 'Nieznana'}
              </p>
              <p>
                <strong>Model:</strong> {ticket.device?.model || 'Nieznany'}
              </p>
              {ticket.device?.serialNumber && (
                <p>
                  <strong>Numer seryjny:</strong> {ticket.device.serialNumber}
                </p>
              )}
              {ticket.device?.year && (
                <p>
                  <strong>Rok produkcji:</strong> {ticket.device.year}
                </p>
              )}
            </div>
          </section>

          {/* Historia statusów */}
          <section className="ticket-section">
            <h3>📜 Historia zmian statusu</h3>
            <div className="status-history">
              {ticket.statusHistory &&
                ticket.statusHistory.map((entry, idx) => (
                  <div key={idx} className="history-entry">
                    <span
                      className="history-status"
                      style={{ backgroundColor: getStatusColor(entry.status) }}
                    >
                      {entry.status}
                    </span>
                    <span className="history-time">
                      {new Date(entry.timestamp).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          {/* Zmiana statusu */}
          {canChangeStatus && nextStatuses.length > 0 && (
            <section className="ticket-section">
              <h3>🔄 Zmień status</h3>
              <div className="status-actions">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating}
                    className="btn-status"
                  >
                    → {status}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Części */}
          {isTechnician && (
            <section className="ticket-section">
              <h3>⚙️ Części ({parts.length})</h3>

              {/* Formularz dodawania części */}
              <form onSubmit={handleAddPart} className="parts-form">
                <div className="form-row">
                  <select
                    value={newPart.type}
                    onChange={(e) => setNewPart({ ...newPart, type: e.target.value })}
                    className="form-input"
                  >
                    <option value="installed">Zainstalowana</option>
                    <option value="removed">Usunięta</option>
                    <option value="ordered">Zamówiona</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Opis części"
                    value={newPart.description}
                    onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <input
                    type="text"
                    placeholder="SKU (opcjonalnie)"
                    value={newPart.sku}
                    onChange={(e) => setNewPart({ ...newPart, sku: e.target.value })}
                    className="form-input"
                  />

                  <input
                    type="text"
                    placeholder="Producent (opcjonalnie)"
                    value={newPart.manufacturer}
                    onChange={(e) => setNewPart({ ...newPart, manufacturer: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <input
                    type="number"
                    placeholder="Cena jednostkowa"
                    value={newPart.unitPrice}
                    onChange={(e) =>
                      setNewPart({ ...newPart, unitPrice: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step="0.01"
                    className="form-input"
                  />

                  <button type="submit" className="btn-add-part">
                    + Dodaj część
                  </button>
                </div>
              </form>

              {/* Lista części */}
              {parts.length > 0 ? (
                <div className="parts-list">
                  {parts.map((part) => (
                    <div key={part.id} className="part-item">
                      <div className="part-header">
                        <span className="part-type">
                          {part.type === 'installed'
                            ? '✅ Zainstalowana'
                            : part.type === 'removed'
                              ? '❌ Usunięta'
                              : '📦 Zamówiona'}
                        </span>
                        <span className="part-description">{part.description}</span>
                      </div>

                      <div className="part-details">
                        {part.sku && (
                          <span>
                            <strong>SKU:</strong> {part.sku}
                          </span>
                        )}
                        {part.manufacturer && (
                          <span>
                            <strong>Producent:</strong> {part.manufacturer}
                          </span>
                        )}
                        <span>
                          <strong>Cena:</strong> {part.unitPrice.toFixed(2)} zł
                        </span>
                        <span>
                          <strong>Status:</strong>
                          <select
                            value={part.status}
                            onChange={(e) => handleUpdatePartStatus(part.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="ordered">Zamówiona</option>
                            <option value="delivered">Dostarczona</option>
                            <option value="installed">Zainstalowana</option>
                          </select>
                        </span>
                      </div>

                      <button onClick={() => handleRemovePart(part.id)} className="btn-remove-part">
                        🗑️ Usuń
                      </button>
                    </div>
                  ))}
                  <div className="parts-summary">
                    <strong>Suma kosztów części: {totalPartsCost.toFixed(2)} zł</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#999' }}>Brak dodanych części</p>
              )}
            </section>
          )}

          {/* Notatki */}
          <section className="ticket-section">
            <h3>📝 Notatki ({notes.length})</h3>

            {isTechnician && (
              <form onSubmit={handleAddNote} className="notes-form">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Dodaj notatkę..."
                  rows="3"
                  className="notes-input"
                />
                <button type="submit" className="btn-add-note">
                  + Dodaj notatkę
                </button>
              </form>
            )}

            {notes.length > 0 ? (
              <div className="notes-list">
                {notes.map((note, idx) => (
                  <div key={idx} className="note-item">
                    <div className="note-header">
                      <strong>{note.author}</strong>
                      <span className="note-time">
                        {new Date(note.createdAt).toLocaleDateString('pl-PL', {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="note-content">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999' }}>Brak notatek</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
