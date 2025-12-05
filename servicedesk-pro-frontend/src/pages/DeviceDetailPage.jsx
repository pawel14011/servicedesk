import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDeviceDetails, getDeviceRepairHistory } from '../services/deviceService';
import { Navbar } from '../components/Navbar';
import '../styles/device-detail.css';
import '../styles/dashboard.css';

export const DeviceDetailPage = () => {
  const { deviceId } = useParams();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [repairHistory, setRepairHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeviceData();
  }, [deviceId]);

  const fetchDeviceData = async () => {
    try {
      setLoading(true);
      const deviceData = await getDeviceDetails(deviceId);
      setDevice(deviceData);

      const history = await getDeviceRepairHistory(deviceId);
      setRepairHistory(history);

      console.log('✅ Device data loaded');
    } catch (err) {
      console.error('Error loading device:', err);
      setError('Nie można załadować danych urządzenia');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="device-detail-container" style={{ padding: '20px' }}>
          Ładowanie...
        </div>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="dashboard">
        <Navbar />
        <div className="device-detail-container" style={{ padding: '20px' }}>
          <p className="error-message">{error || 'Nie znaleziono urządzenia'}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Navbar />
      <div className="device-detail-container" style={{ padding: '20px' }}>
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Wróć do listy
        </button>

        <div className="device-detail-card">
          <div className="device-header">
            <div>
              <h2>
                {device.brand} {device.model}
              </h2>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="device-sections">
          {/* Informacje ogólne */}
          <section className="device-section">
            <h3>📋 Informacje ogólne</h3>
            <div className="info-grid">
              <div>
                <strong>Marka:</strong> {device.brand}
              </div>
              <div>
                <strong>Model:</strong> {device.model}
              </div>
              <div>
                <strong>Numer seryjny:</strong> {device.serialNumber || 'Brak'}
              </div>
              <div>
                <strong>Rok produkcji:</strong> {device.yearProduction || 'Brak'}
              </div>
              <div>
                <strong>Data dodania:</strong>{' '}
                {new Date(device.createdAt).toLocaleDateString('pl-PL')}
              </div>
            </div>
          </section>

          {/* Historia napraw */}
          <section className="device-section">
            <h3>🔧 Historia napraw ({repairHistory.length})</h3>

            {repairHistory.length > 0 ? (
              <div className="repairs-timeline">
                {repairHistory.map((ticket, idx) => (
                  <div key={ticket.id} className="repair-item">
                    <div className="repair-header">
                      <span className="repair-number">{ticket.ticketNumber}</span>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(ticket.status) }}
                      >
                        {ticket.status}
                      </span>
                      <span className="repair-date">
                        {new Date(ticket.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                    <p className="repair-description">{ticket.description}</p>
                    <button
                      onClick={() => navigate(`/ticket/${ticket.id}`)}
                      className="btn-view-ticket"
                    >
                      Szczegóły →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999' }}>Brak historii napraw</p>
            )}
          </section>
          </div>
        </div>
      </div>
    </div>
  );
};
