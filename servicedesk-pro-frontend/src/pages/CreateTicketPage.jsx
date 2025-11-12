import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createTicket,
  getTechnicianWithLeastLoad,
  assignTicketToTechnician,
} from '../services/ticketService';
import { uploadImage } from '../services/storageService';
import '../styles/ticket-form.css';

export const CreateTicketPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    deviceBrand: '',
    deviceModel: '',
    deviceSerialNumber: '',
    deviceYear: new Date().getFullYear(),
    preferredDeliveryDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Walidacja
    if (!file.type.startsWith('image/')) {
      alert('Plik musi być obrazem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest zbyt duży (max 5MB)');
      return;
    }

    setSelectedImage(file);

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Tworzymy ticket
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
        images: [], // Zainicjalizuj pustą tablicę
      });

      // 2. Jeśli jest zdjęcie, upload
      if (selectedImage) {
        try {
          const imageData = await uploadImage(selectedImage, ticketId);
          // Dodaj zdjęcie do ticketu
          const { addImageToTicket } = await import('../services/ticketService');
          await addImageToTicket(ticketId, imageData);
          console.log('✅ Image uploaded to ticket');
        } catch (imgError) {
          console.error('⚠️ Error uploading image:', imgError);
          // Nie blokuj tworzenia ticketu jeśli upload się nie uda
        }
      }

      // 3. Przypisz do technika
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

        {/* ============= NOWA SEKCJA: ZDJĘCIE ============= */}
        <div className="form-section">
          <h3>📸 Zdjęcie urządzenia (opcjonalnie)</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>
            Dodaj zdjęcie uszkodzonego urządzenia
          </p>

          {!imagePreview ? (
            <label className="upload-label-inline">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <span className="upload-button-inline">📷 Wybierz zdjęcie</span>
            </label>
          ) : (
            <div className="image-preview-box">
              <img src={imagePreview} alt="Preview" />
              <button type="button" onClick={removeImage} className="btn-remove-image">
                🗑️ Usuń zdjęcie
              </button>
            </div>
          )}
          <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
            Maksymalny rozmiar: 5MB. Obsługiwane: JPG, PNG, GIF
          </small>
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
