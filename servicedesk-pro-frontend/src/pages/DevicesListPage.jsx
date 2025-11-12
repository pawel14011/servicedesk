import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllDevices, getClientDevices } from '../services/deviceService';
import '../styles/devices-list.css';

export const DevicesListPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [userRole]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      let data = [];
      if (userRole === 'manager' || userRole === 'worker' || userRole === 'technician') {
        data = await getAllDevices();
      } else if (userRole === 'client') {
        data = await getClientDevices(user.uid);
      }
      setDevices(data);
      console.log('✅ Devices loaded:', data.length);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWarrantyBadge = (status) => {
    if (status === 'active') {
      return <span className="warranty-badge active">✅ Gwarancja aktywna</span>;
    } else {
      return <span className="warranty-badge expired">❌ Gwarancja wygasła</span>;
    }
  };

  return (
    <div className="devices-list-container">
      <div className="devices-header">
        <h2>Urządzenia</h2>
        {userRole === 'client' && (
          <button onClick={() => navigate('/add-device')} className="btn-primary">
            + Dodaj urządzenie
          </button>
        )}
      </div>

      {loading ? (
        <p>Ładowanie...</p>
      ) : devices.length === 0 ? (
        <p>Brak urządzeń</p>
      ) : (
        <div className="devices-grid">
          {devices.map((device) => (
            <div key={device.id} className="device-card">
              <div className="device-header">
                <h3>
                  {device.brand} {device.model}
                </h3>
                {getWarrantyBadge(device.warrantyStatus)}
              </div>

              <div className="device-info">
                <p>
                  <strong>Numer seryjny:</strong> {device.serialNumber || 'Brak'}
                </p>
                <p>
                  <strong>Rok produkcji:</strong> {device.yearProduction || 'Brak'}
                </p>
                {device.warrantyExpireDate && (
                  <p>
                    <strong>Gwarancja do:</strong>{' '}
                    {new Date(device.warrantyExpireDate).toLocaleDateString('pl-PL')}
                  </p>
                )}
                <p>
                  <strong>Naprawy:</strong> {device.repairHistory?.length || 0}
                </p>
              </div>

              <button onClick={() => navigate(`/device/${device.id}`)} className="btn-view-device">
                Szczegóły
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
