import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTickets, getClientTickets, getTechnicianTickets } from '../services/ticketService';
import '../styles/tickets-list.css';

export const TicketsListPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [userRole]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let data = [];
      if (userRole === 'manager') {
        data = await getAllTickets();
      } else if (userRole === 'client') {
        // Klient widzi tylko swoje tickety
        data = await getClientTickets(user.uid);
      } else if (userRole === 'technician') {
        // Technik widzi tylko przypisane tickety
        if (user?.uid) {
          data = await getTechnicianTickets(user.uid);
        }
      } else if (userRole === 'worker') {
        // Worker widzi wszystkie tickety (tylko do przeglądania)
        data = await getAllTickets();
      }
      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const getStatusBadgeColor = (status) => {
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

  return (
    <div className="tickets-list-container">
      <div className="tickets-header">
        <h2>Zgłoszenia serwisowe</h2>
        {userRole === 'client' && (
          <button onClick={() => navigate('/create-ticket')} className="btn-primary">
            + Nowe zgłoszenie
          </button>
        )}
      </div>

      <div className="tickets-filters">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          Wszystkie ({tickets.length})
        </button>
        <button
          className={filter === 'Registered' ? 'active' : ''}
          onClick={() => setFilter('Registered')}
        >
          Zarejestrowane
        </button>
        <button
          className={filter === 'Received' ? 'active' : ''}
          onClick={() => setFilter('Received')}
        >
          Przyjęte
        </button>
        <button
          className={filter === 'Waiting for Parts' ? 'active' : ''}
          onClick={() => setFilter('Waiting for Parts')}
        >
          Oczekujące na części
        </button>
        <button
          className={filter === 'Repairing' ? 'active' : ''}
          onClick={() => setFilter('Repairing')}
        >
          W naprawie
        </button>
        <button className={filter === 'Ready' ? 'active' : ''} onClick={() => setFilter('Ready')}>
          Gotowe
        </button>
        <button className={filter === 'Closed' ? 'active' : ''} onClick={() => setFilter('Closed')}>
          Zamknięte
        </button>
      </div>

      {loading ? (
        <p>Ładowanie...</p>
      ) : filteredTickets.length === 0 ? (
        <p>Brak zgłoszeń</p>
      ) : (
        <table className="tickets-table">
          <thead>
            <tr>
              <th>Nr. Zgłoszenia</th>
              <th>Urządzenie</th>
              <th>Opis</th>
              <th>Status</th>
              <th>Data utworzenia</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>
                  <strong>{ticket.ticketNumber}</strong>
                </td>
                <td>
                  {ticket.device?.brand} {ticket.device?.model}
                </td>
                <td>{ticket.description.substring(0, 50)}...</td>
                <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: getStatusBadgeColor(ticket.status) }}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td>{new Date(ticket.createdAt).toLocaleDateString('pl-PL')}</td>
                <td>
                  <button onClick={() => navigate(`/ticket/${ticket.id}`)} className="btn-view">
                    Szczegóły
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
