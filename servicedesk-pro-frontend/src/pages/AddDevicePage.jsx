import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDevice } from '../services/deviceService';
import { Navbar } from '../components/Navbar';
import '../styles/device-form.css';
import '../styles/dashboard.css';

export const AddDevicePage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    serialNumber: '',
    yearProduction: new Date().getFullYear(),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Walidacja roku produkcji
    if (formData.yearProduction < 2000) {
      setError('Rok produkcji nie może być starszy niż 2000');
      setLoading(false);
      return;
    }

    try {
      await createDevice({
        ...formData,
        ownerId: user.uid,
      });

      alert('✅ Urządzenie dodane!');
      navigate('/devices');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <Navbar />
      <div className="device-form-container" style={{ padding: '20px' }}>
        <h2>Dodaj nowe urządzenie</h2>

        {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Dane urządzenia</h3>

          <div className="form-group">
            <label>Marka:</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="np. Dell, Apple, HP"
              required
            />
          </div>

          <div className="form-group">
            <label>Model:</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="np. XPS 13, MacBook Pro"
              required
            />
          </div>

          <div className="form-group">
            <label>Numer seryjny (opcjonalnie):</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="np. SN-12345678"
            />
          </div>

          <div className="form-group">
            <label>Rok produkcji:</label>
            <input
              type="number"
              name="yearProduction"
              value={formData.yearProduction}
              onChange={handleChange}
              min="2000"
              max={new Date().getFullYear()}
              required
            />
            {formData.yearProduction < 2000 && (
              <small style={{ color: 'red' }}>Rok produkcji nie może być starszy niż 2000</small>
            )}
          </div>
        </div>


        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Dodawanie...' : 'Dodaj urządzenie'}
        </button>
      </form>
      </div>
    </div>
  );
};
