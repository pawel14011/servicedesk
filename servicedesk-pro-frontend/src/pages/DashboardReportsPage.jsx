import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { generateTicketsReportPDF } from '../services/pdfService';
import {
  getTicketStats,
  calculateAverageRepairTime,
  getPartsStatistics,
  getTechnicianPerformance,
} from '../services/ticketService';
import { getUsersByRole } from '../services/userService';
import { Navbar } from '../components/Navbar';
import '../styles/dashboard-reports.css';
import '../styles/dashboard.css';

export const DashboardReportsPage = () => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [partsStats, setPartsStats] = useState([]);
  const [techPerformance, setTechPerformance] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [averageRepairTime, setAverageRepairTime] = useState(0);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Pobierz stats ticketów
      const { stats: ticketStats, tickets: allTickets } = await getTicketStats();
      setStats(ticketStats);
      setTickets(allTickets);

      // Oblicz średni czas naprawy
      const avgTime = calculateAverageRepairTime(allTickets);
      setAverageRepairTime(avgTime);

      // Pobierz statystyki części
      const parts = await getPartsStatistics();
      setPartsStats(parts);

      // Pobierz wydajność techników
      const performance = await getTechnicianPerformance();
      setTechPerformance(performance);

      // Pobierz dane techników
      const techsData = await getUsersByRole('technician');
      setTechnicians(techsData);

      console.log('✅ Report data loaded');
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTechnicianName = (techId) => {
    const tech = technicians.find((t) => t.id === techId);
    return tech ? tech.fullName : 'Nieznany';
  };

  const getClosureRate = (techId) => {
    const perf = techPerformance[techId];
    if (!perf || perf.total === 0) return 0;
    return ((perf.closed / perf.total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="dashboard-reports-container" style={{ padding: '20px' }}>
          Ładowanie raportów...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="dashboard-reports-container" style={{ padding: '20px' }}>
          Błąd ładowania danych
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-reports-container" style={{ padding: '20px' }}>
        <div className="reports-header">
        <h1>📊 Raporty i Statystyki</h1>

        <button
          onClick={() => {
            generateTicketsReportPDF(tickets, stats);
            alert('✅ Raport PDF pobrany!');
          }}
          className="btn-download-pdf"
        >
          📥 Pobierz Raport PDF
        </button>
        <button onClick={fetchReportData} className="btn-refresh">
          🔄 Odśwież
        </button>
      </div>

      {/* ============= KPI CARDS ============= */}
      <section className="kpi-section">
        <h2>📈 Kluczowe Wskaźniki</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">📋</div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.total}</div>
              <div className="kpi-label">Łącznie ticketów</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🔴</div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.open}</div>
              <div className="kpi-label">Otwarte tickety</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">✅</div>
            <div className="kpi-content">
              <div className="kpi-value">{stats.closed}</div>
              <div className="kpi-label">Zamknięte tickety</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">⏱️</div>
            <div className="kpi-content">
              <div className="kpi-value">{averageRepairTime}</div>
              <div className="kpi-label">Średni czas (dni)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= STATUS BREAKDOWN ============= */}
      <section className="stats-section">
        <h2>📊 Rozkład statusów</h2>
        <div className="status-breakdown">
          <div className="status-row">
            <div className="status-label">Zarejestrowane:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{
                  width: `${(stats.registered / stats.total) * 100}%`,
                  background: '#FFC107',
                }}
              >
                {stats.registered}
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-label">Przyjęte:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{ width: `${(stats.received / stats.total) * 100}%`, background: '#2196F3' }}
              >
                {stats.received}
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-label">W diagnozie:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{
                  width: `${(stats.diagnosed / stats.total) * 100}%`,
                  background: '#9C27B0',
                }}
              >
                {stats.diagnosed}
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-label">W naprawie:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{
                  width: `${(stats.repairing / stats.total) * 100}%`,
                  background: '#FF9800',
                }}
              >
                {stats.repairing}
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-label">Gotowe:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{ width: `${(stats.ready / stats.total) * 100}%`, background: '#4CAF50' }}
              >
                {stats.ready}
              </div>
            </div>
          </div>

          <div className="status-row">
            <div className="status-label">Zamknięte:</div>
            <div className="status-bar">
              <div
                className="status-fill"
                style={{ width: `${(stats.closed / stats.total) * 100}%`, background: '#757575' }}
              >
                {stats.closed}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= TECHNICIAN PERFORMANCE ============= */}
      <section className="performance-section">
        <h2>👨‍🔧 Wydajność techników</h2>
        <div className="performance-table">
          <table>
            <thead>
              <tr>
                <th>Technik</th>
                <th>Łącznie</th>
                <th>Zamknięte</th>
                <th>Otwarte</th>
                <th>Procent zamknięcia</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => {
                const perf = techPerformance[tech.id] || { total: 0, closed: 0, open: 0 };
                return (
                  <tr key={tech.id}>
                    <td>
                      <strong>{tech.fullName}</strong>
                    </td>
                    <td>{perf.total}</td>
                    <td style={{ color: '#4CAF50', fontWeight: 'bold' }}>{perf.closed}</td>
                    <td style={{ color: '#FF9800', fontWeight: 'bold' }}>{perf.open}</td>
                    <td>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${getClosureRate(tech.id)}%` }}
                        >
                          {getClosureRate(tech.id)}%
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============= TOP PARTS ============= */}
      <section className="parts-section">
        <h2>🔧 Najczęściej wymieniane części (TOP 10)</h2>
        <div className="parts-list">
          {partsStats.length > 0 ? (
            partsStats.map((part, idx) => (
              <div key={idx} className="part-stat">
                <div className="part-rank">{idx + 1}</div>
                <div className="part-name">{part[0]}</div>
                <div className="part-count">
                  <div className="count-value">{part[1]}x</div>
                </div>
              </div>
            ))
          ) : (
            <p>Brak danych o częściach</p>
          )}
        </div>
      </section>
      </div>
    </div>
  );
};
