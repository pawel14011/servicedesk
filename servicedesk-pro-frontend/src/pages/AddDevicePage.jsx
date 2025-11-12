import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createDevice } from '../services/deviceService';
import '../styles/device-form.css';

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
    warrantyStatus: 'active',
    warrantyExpireDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
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

    try {
      await createDevice({
        ...formData,
        ownerId: user.uid,
        warrantyExpireDate: formData.warrantyExpireDate
          ? new Date(formData.warrantyExpireDate).toISOString()
          : null,
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
    <div className="device-form-container">
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
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Gwarancja</h3>

          <div className="form-group">
            <label>Status gwarancji:</label>
            <select name="warrantyStatus" value={formData.warrantyStatus} onChange={handleChange}>
              <option value="active">Aktywna</option>
              <option value="expired">Wygasła</option>
            </select>
          </div>

          <div className="form-group">
            <label>Data wygaśnięcia gwarancji (opcjonalnie):</label>
            <input
              type="date"
              name="warrantyExpireDate"
              value={formData.warrantyExpireDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Dodawanie...' : 'Dodaj urządzenie'}
        </button>
      </form>
    </div>
  );
};
