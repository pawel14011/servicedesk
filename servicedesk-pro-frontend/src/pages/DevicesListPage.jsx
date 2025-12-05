import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllDevices, getClientDevices, getDeviceRepairHistory } from '../services/deviceService';
import '../styles/devices-list.css';

export const DevicesListPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repairCounts, setRepairCounts] = useState({});

  useEffect(() => {
    fetchDevices();
  }, [userRole]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      let data = [];
      if (userRole === 'manager' || userRole === 'worker' || userRole === 'technician') {
        // Manager, worker i technik widzą wszystkie urządzenia
        data = await getAllDevices();
      } else if (userRole === 'client') {
        // Klient widzi tylko swoje urządzenia
        if (user?.uid) {
          data = await getClientDevices(user.uid);
        }
      }
      setDevices(data);
      
      // Pobierz liczniki napraw dla każdego urządzenia
      const counts = {};
      for (const device of data) {
        try {
          const history = await getDeviceRepairHistory(device.id);
          counts[device.id] = history.length;
        } catch (err) {
          console.warn(`Could not fetch repair history for device ${device.id}:`, err);
          counts[device.id] = device.repairHistory?.length || 0;
        }
      }
      setRepairCounts(counts);
      
      console.log('✅ Devices loaded:', data.length);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
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
              </div>

              <div className="device-info">
                <p>
                  <strong>Numer seryjny:</strong> {device.serialNumber || 'Brak'}
                </p>
                <p>
                  <strong>Rok produkcji:</strong> {device.yearProduction || 'Brak'}
                </p>
                <p>
                  <strong>Naprawy:</strong> {repairCounts[device.id] !== undefined ? repairCounts[device.id] : (device.repairHistory?.length || 0)}
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
