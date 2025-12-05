import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createTicket,
  getTechnicianWithLeastLoad,
  assignTicketToTechnician,
} from '../services/ticketService';
import { uploadImage } from '../services/storageService';
import { getClientDevices, createDevice } from '../services/deviceService';
import { Navbar } from '../components/Navbar';
import '../styles/ticket-form.css';
import '../styles/dashboard.css';

export const CreateTicketPage = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [clientDevices, setClientDevices] = useState([]);

  const [formData, setFormData] = useState({
    description: '',
    deviceId: '', // 'new' lub ID urządzenia
    deviceBrand: '',
    deviceModel: '',
    deviceSerialNumber: '',
    deviceYear: new Date().getFullYear(),
    preferredDeliveryDate: '',
  });

  // Pobierz urządzenia klienta przy załadowaniu
  useEffect(() => {
    if (user?.uid) {
      fetchClientDevices();
    }
  }, [user]);

  const fetchClientDevices = async () => {
    try {
      const devices = await getClientDevices(user.uid);
      setClientDevices(devices);
      console.log('✅ Loaded client devices:', devices.length);
      
      // Jeśli nie ma urządzeń, automatycznie ustaw tryb "dodaj nowe"
      if (devices.length === 0) {
        setFormData((prev) => ({
          ...prev,
          deviceId: 'new',
        }));
      }
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Jeśli wybrano urządzenie z listy, wypełnij formularz danymi urządzenia
    if (name === 'deviceId' && value !== 'new' && value !== '') {
      const selectedDevice = clientDevices.find((d) => d.id === value);
      if (selectedDevice) {
        setFormData((prev) => ({
          ...prev,
          deviceBrand: selectedDevice.brand || '',
          deviceModel: selectedDevice.model || '',
          deviceSerialNumber: selectedDevice.serialNumber || '',
          deviceYear: selectedDevice.yearProduction || new Date().getFullYear(),
        }));
      }
    } else if (name === 'deviceId' && value === 'new') {
      // Jeśli wybrano "Dodaj nowe", wyczyść pola
      setFormData((prev) => ({
        ...prev,
        deviceBrand: '',
        deviceModel: '',
        deviceSerialNumber: '',
        deviceYear: new Date().getFullYear(),
      }));
    }
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

    // Walidacja roku produkcji
    if (formData.deviceYear < 2000) {
      setError('Rok produkcji nie może być starszy niż 2000');
      setLoading(false);
      return;
    }

    try {
      // 1. Jeśli urządzenie to "new" lub nie ma urządzeń — utwórz nowe
      let deviceId = formData.deviceId;
      if (formData.deviceId === 'new' || clientDevices.length === 0) {
        if (!formData.deviceBrand || !formData.deviceModel) {
          setError('Podaj markę i model urządzenia');
          setLoading(false);
          return;
        }
        deviceId = await createDevice({
          brand: formData.deviceBrand,
          model: formData.deviceModel,
          serialNumber: formData.deviceSerialNumber,
          yearProduction: parseInt(formData.deviceYear),
          ownerId: user.uid,
        });
        console.log('✅ New device created:', deviceId);
      }

      // Jeśli nie wybrano urządzenia i nie utworzono nowego
      if (!deviceId || deviceId === '') {
        setError('Wybierz urządzenie lub dodaj nowe');
        setLoading(false);
        return;
      }

      // Pobierz dane wybranego urządzenia
      const selectedDevice = clientDevices.find((d) => d.id === deviceId);

      // 2. Tworzymy ticket
      const ticketId = await createTicket({
        clientId: user.uid,
        deviceId: deviceId,
        description: formData.description,
        device: {
          brand: formData.deviceBrand || selectedDevice?.brand,
          model: formData.deviceModel || selectedDevice?.model,
          serialNumber: formData.deviceSerialNumber || selectedDevice?.serialNumber,
          year: parseInt(formData.deviceYear) || selectedDevice?.yearProduction,
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
    <div className="dashboard">
      <Navbar />
      <div className="ticket-form-container" style={{ padding: '20px' }}>
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

          {clientDevices.length > 0 && (
            <div className="form-group">
              <label>Wybierz urządzenie:</label>
              <select
                name="deviceId"
                value={formData.deviceId}
                onChange={handleChange}
                required
              >
                <option value="">-- Wybierz urządzenie --</option>
                {clientDevices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.brand} {device.model}
                    {device.serialNumber ? ` (SN: ${device.serialNumber})` : ''}
                  </option>
                ))}
                <option value="new">➕ Dodaj nowe urządzenie</option>
              </select>
            </div>
          )}

          {/* Jeśli wybrano "Dodaj nowe urządzenie" lub nie ma żadnych urządzeń */}
          {(formData.deviceId === 'new' || clientDevices.length === 0) && (
            <div
              style={{
                marginTop: clientDevices.length > 0 ? '15px' : '0',
                background: clientDevices.length > 0 ? '#fff3e0' : 'transparent',
                padding: clientDevices.length > 0 ? '15px' : '0',
                borderRadius: clientDevices.length > 0 ? '5px' : '0',
              }}
            >
              {clientDevices.length > 0 && (
                <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>Dane nowego urządzenia:</h4>
              )}

              <div className="form-group">
                <label>Marka:</label>
                <input
                  type="text"
                  name="deviceBrand"
                  value={formData.deviceBrand}
                  onChange={handleChange}
                  placeholder="np. Dell, Apple, HP"
                  required={formData.deviceId === 'new' || clientDevices.length === 0}
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
                  required={formData.deviceId === 'new' || clientDevices.length === 0}
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
                  required={formData.deviceId === 'new' || clientDevices.length === 0}
                />
                {formData.deviceYear < 2000 && (
                  <small style={{ color: 'red' }}>Rok produkcji nie może być starszy niż 2000</small>
                )}
              </div>
            </div>
          )}
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
    </div>
  );
};
