import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTickets, reassignTicket, getTechnicianStats } from '../services/ticketService';
import { getUsersByRole } from '../services/userService';
import '../styles/manager-tickets.css';

export const ManagerTicketsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [reassigningId, setReassigningId] = useState(null);
  const [selectedNewTech, setSelectedNewTech] = useState('');
  const [technicianStats, setTechnicianStats] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const ticketsData = await getAllTickets();
      const techniciansData = await getUsersByRole('technician');

      setTickets(ticketsData);
      setTechnicians(techniciansData);

      // Pobierz statystyki dla każdego technika
      const stats = {};
      for (const tech of techniciansData) {
        const count = await getTechnicianStats(tech.id);
        stats[tech.id] = count;
      }
      setTechnicianStats(stats);

      console.log('✅ Manager data loaded');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter);

  const handleReassign = async (ticketId, newTechnicianId) => {
    if (!newTechnicianId) {
      alert('Wybierz technika');
      return;
    }

    try {
      await reassignTicket(ticketId, newTechnicianId, user.uid);
      alert('✅ Ticket reassigned!');
      setReassigningId(null);
      setSelectedNewTech('');
      await fetchData();
    } catch (error) {
      console.error('Error reassigning:', error);
      alert('❌ Error reassigning ticket');
    }
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

  const getTechnicianName = (technicianId) => {
    const tech = technicians.find((t) => t.id === technicianId);
    return tech ? tech.fullName : 'Nieznany';
  };

  return (
    <div className="manager-tickets-container">
      <div className="manager-header">
        <h2>📊 Manager — Zarządzanie ticketami</h2>
        <button onClick={fetchData} className="btn-refresh">
          🔄 Odśwież
        </button>
      </div>

      {/* Statystyki techników */}
      <div className="technician-stats">
        <h3>👨‍🔧 Obciążenie techników</h3>
        <div className="stats-grid">
          {technicians.map((tech) => (
            <div key={tech.id} className="stat-card">
              <div className="stat-name">{tech.fullName}</div>
              <div className="stat-count">{technicianStats[tech.id] || 0}</div>
              <div className="stat-label">otwartych ticketów</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtry */}
      <div className="manager-filters">
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

      {/* Tabela ticketów */}
      {loading ? (
        <p>Ładowanie...</p>
      ) : filteredTickets.length === 0 ? (
        <p>Brak ticketów</p>
      ) : (
        <div className="manager-table-container">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Nr. Ticketu</th>
                <th>Klient</th>
                <th>Urządzenie</th>
                <th>Status</th>
                <th>Technik</th>
                <th>Data</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong>{ticket.ticketNumber}</strong>
                  </td>
                  <td>{ticket.clientId ? '👤' : 'N/A'}</td>
                  <td>
                    {ticket.device?.brand} {ticket.device?.model}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{ backgroundColor: getStatusColor(ticket.status) }}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td>
                    <span className="technician-name">
                      {getTechnicianName(ticket.technicianId)}
                    </span>
                  </td>
                  <td>{new Date(ticket.createdAt).toLocaleDateString('pl-PL')}</td>
                  <td>
                    <div className="actions-group">
                      <button onClick={() => navigate(`/ticket/${ticket.id}`)} className="btn-view">
                        Szczegóły
                      </button>

                      {reassigningId === ticket.id ? (
                        <div className="reassign-inline">
                          <select
                            value={selectedNewTech}
                            onChange={(e) => setSelectedNewTech(e.target.value)}
                            className="reassign-select"
                          >
                            <option value="">Wybierz...</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.fullName} ({technicianStats[tech.id] || 0})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleReassign(ticket.id, selectedNewTech)}
                            className="btn-confirm"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => {
                              setReassigningId(null);
                              setSelectedNewTech('');
                            }}
                            className="btn-cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReassigningId(ticket.id)}
                          className="btn-reassign"
                        >
                          ↔️ Przypisz
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
