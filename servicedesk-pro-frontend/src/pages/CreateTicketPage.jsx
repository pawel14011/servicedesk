import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createTicket,
  getTechnicianWithLeastLoad,
  assignTicketToTechnician,
} from '../services/ticketService';
import '../styles/ticket-form.css';

export const CreateTicketPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    description: '',
    deviceBrand: '',
    deviceModel: '',
    deviceSerialNumber: '',
    deviceYear: new Date().getFullYear(),
    imageUrl: '',
    preferredDeliveryDate: '',
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
      // Tworzymy ticket
      const ticketId = await createTicket({
        clientId: user.uid,
        description: formData.description,
        device: {
          brand: formData.deviceBrand,
          model: formData.deviceModel,
          serialNumber: formData.deviceSerialNumber,
          year: parseInt(formData.deviceYear),
        },
        preferredDeliveryDate: formData.preferredDeliveryDate || null,
        imageUrl: formData.imageUrl,
      });

      // Automatycznie przypisujemy do technika z najmniejszym obciążeniem
      const leastLoadedTech = await getTechnicianWithLeastLoad();
      if (leastLoadedTech) {
        await assignTicketToTechnician(ticketId, leastLoadedTech, user.uid);
        console.log(`✅ Ticket assigned to technician: ${leastLoadedTech}`);
      }

      alert('✅ Ticket created successfully!');
      navigate('/my-tickets');
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket-form-container">
      <h2>Zgłoś nową awarię</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Opis problemu</h3>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Opisz dokładnie problem z urządzeniem..."
            required
            rows="5"
          />
        </div>

        <div className="form-section">
          <h3>Dane urządzenia</h3>

          <div className="form-group">
            <label>Marka:</label>
            <input
              type="text"
              name="deviceBrand"
              value={formData.deviceBrand}
              onChange={handleChange}
              placeholder="np. Dell, Apple, HP"
            />
          </div>

          <div className="form-group">
            <label>Model:</label>
            <input
              type="text"
              name="deviceModel"
              value={formData.deviceModel}
              onChange={handleChange}
              placeholder="np. XPS 13, MacBook Pro"
            />
          </div>

          <div className="form-group">
            <label>Numer seryjny (opcjonalnie):</label>
            <input
              type="text"
              name="deviceSerialNumber"
              value={formData.deviceSerialNumber}
              onChange={handleChange}
              placeholder="np. SN-12345678"
            />
          </div>

          <div className="form-group">
            <label>Rok produkcji:</label>
            <input
              type="number"
              name="deviceYear"
              value={formData.deviceYear}
              onChange={handleChange}
              min="2000"
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Preferencje</h3>
          <div className="form-group">
            <label>Preferowana data dostawy (opcjonalnie):</label>
            <input
              type="date"
              name="preferredDeliveryDate"
              value={formData.preferredDeliveryDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Tworzenie zgłoszenia...' : 'Zgłoś awarię'}
        </button>
      </form>
    </div>
  );
};
