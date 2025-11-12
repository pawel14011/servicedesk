import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  createTicket,
  getTechnicianWithLeastLoad,
  assignTicketToTechnician,
} from '../services/ticketService';
import { getUsersByRole, createUserProfile } from '../services/userService';
import { getClientDevices, createDevice } from '../services/deviceService';
import '../styles/ticket-form.css';

export const CreateTicketByWorkerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // Listy
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [clientDevices, setClientDevices] = useState([]);

  // Formularz
  const [formData, setFormData] = useState({
    clientId: '', // 'new' lub UID
    technicianId: 'auto',
    description: '',
    deviceId: '', // 'new' lub ID
    // Dla nowego klienta:
    newClientName: '',
    newClientEmail: '',
    newClientPhone: '',
    // Dla nowego urządzenia:
    deviceBrand: '',
    deviceModel: '',
    deviceSerialNumber: '',
    deviceYear: new Date().getFullYear(),
    assetTag: '',
    imageUrl: '',
  });

  useEffect(() => {
    fetchClientsAndTechnicians();
  }, []);

  useEffect(() => {
    if (formData.clientId && formData.clientId !== 'new') {
      fetchClientDevices();
    } else {
      setClientDevices([]);
    }
  }, [formData.clientId]);

  const fetchClientsAndTechnicians = async () => {
    try {
      const clientsData = await getUsersByRole('client');
      const techniciansData = await getUsersByRole('technician');
      setClients(clientsData);
      setTechnicians(techniciansData);
      console.log('✅ Loaded clients and technicians');
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const fetchClientDevices = async () => {
    try {
      const devices = await getClientDevices(formData.clientId);
      setClientDevices(devices);
      console.log('✅ Loaded client devices:', devices.length);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Jeśli klient to "new" — utwórz nowego
      let clientId = formData.clientId;
      if (formData.clientId === 'new') {
        if (!formData.newClientName) {
          throw new Error('Podaj imię i nazwisko klienta');
        }
        clientId = await createUserProfile({
          fullName: formData.newClientName,
          email: formData.newClientEmail,
          phone: formData.newClientPhone,
          role: 'client',
          createdBy: user.uid,
        });
        console.log('✅ New client created:', clientId);
      }

      // 2. Jeśli urządzenie to "new" — utwórz nowe
      let deviceId = formData.deviceId;
      if (formData.deviceId === 'new' || formData.clientId === 'new') {
        if (!formData.deviceBrand || !formData.deviceModel) {
          throw new Error('Podaj markę i model urządzenia');
        }
        deviceId = await createDevice({
          brand: formData.deviceBrand,
          model: formData.deviceModel,
          serialNumber: formData.deviceSerialNumber,
          yearProduction: parseInt(formData.deviceYear),
          ownerId: clientId,
          warrantyStatus: 'unknown',
          assetTag: formData.assetTag,
        });
        console.log('✅ New device created:', deviceId);
      }

      // 3. Utwórz ticket
      const ticketId = await createTicket({
        clientId: clientId,
        deviceId: deviceId,
        description: formData.description,
        imageUrl: formData.imageUrl,
        assetTag: formData.assetTag,
        createdBy: user.uid,
        device: {
          brand: formData.deviceBrand || clientDevices.find((d) => d.id === deviceId)?.brand,
          model: formData.deviceModel || clientDevices.find((d) => d.id === deviceId)?.model,
          serialNumber:
            formData.deviceSerialNumber ||
            clientDevices.find((d) => d.id === deviceId)?.serialNumber,
          year:
            parseInt(formData.deviceYear) ||
            clientDevices.find((d) => d.id === deviceId)?.yearProduction,
        },
      });

      if (selectedImage) {
        try {
          const { uploadImage } = await import('../services/storageService');
          const { addImageToTicket } = await import('../services/ticketService');
          const imageData = await uploadImage(selectedImage, ticketId);
          await addImageToTicket(ticketId, imageData);
          console.log('✅ Image uploaded to ticket');
        } catch (imgError) {
          console.error('⚠️ Error uploading image:', imgError);
        }
      }

      // 4. Przypisz do technika
      let assignedTechId = formData.technicianId;
      if (formData.technicianId === 'auto') {
        assignedTechId = await getTechnicianWithLeastLoad();
      }

      if (assignedTechId) {
        await assignTicketToTechnician(ticketId, assignedTechId, user.uid);
        console.log(`✅ Ticket assigned to technician: ${assignedTechId}`);
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Plik musi być obrazem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest zbyt duży (max 5MB)');
      return;
    }

    setSelectedImage(file);

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

  const isNewClient = formData.clientId === 'new';
  const showDeviceSection = formData.clientId && formData.clientId !== '';

  return (
    <div className="ticket-form-container">
      <h2>Nowe zgłoszenie serwisowe (Worker)</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Wybór klienta */}
        <div className="form-section">
          <h3>1️⃣ Klient</h3>
          <div className="form-group">
            <label>Wybierz klienta:</label>
            <select name="clientId" value={formData.clientId} onChange={handleChange} required>
              <option value="">-- Wybierz klienta --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName} ({client.email || client.phone || 'brak kontaktu'})
                </option>
              ))}
              <option value="new">➕ Nowy klient (nie ma konta)</option>
            </select>
          </div>

          {/* Jeśli "nowy klient" */}
          {isNewClient && (
            <div
              style={{
                marginTop: '15px',
                background: '#f0f8ff',
                padding: '15px',
                borderRadius: '5px',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#667eea' }}>Dane nowego klienta:</h4>

              <div className="form-group">
                <label>Imię i nazwisko: *</label>
                <input
                  type="text"
                  name="newClientName"
                  value={formData.newClientName}
                  onChange={handleChange}
                  placeholder="np. Jan Kowalski"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email (opcjonalnie):</label>
                <input
                  type="email"
                  name="newClientEmail"
                  value={formData.newClientEmail}
                  onChange={handleChange}
                  placeholder="np. jan@example.com"
                />
              </div>

              <div className="form-group">
                <label>Telefon: *</label>
                <input
                  type="tel"
                  name="newClientPhone"
                  value={formData.newClientPhone}
                  onChange={handleChange}
                  placeholder="np. 123456789"
                  required
                />
              </div>
              <small style={{ color: '#999' }}>
                ℹ️ Klient nie będzie mógł się zalogować do systemu (brak hasła). Jego dane będą
                tylko w bazie do kontaktu.
              </small>
            </div>
          )}
        </div>

        {/* Wybór urządzenia */}
        {showDeviceSection && (
          <div className="form-section">
            <h3>2️⃣ Urządzenie</h3>

            {!isNewClient && (
              <div className="form-group">
                <label>Wybierz urządzenie:</label>
                <select name="deviceId" value={formData.deviceId} onChange={handleChange} required>
                  <option value="">-- Wybierz urządzenie --</option>
                  {clientDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.brand} {device.model} (SN: {device.serialNumber || 'brak'})
                    </option>
                  ))}
                  <option value="new">➕ Dodaj nowe urządzenie</option>
                </select>
              </div>
            )}

            {/* Jeśli "nowe urządzenie" lub nowy klient */}
            {(formData.deviceId === 'new' || isNewClient) && (
              <div
                style={{
                  marginTop: '15px',
                  background: '#fff3e0',
                  padding: '15px',
                  borderRadius: '5px',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>Dane urządzenia:</h4>

                <div className="form-group">
                  <label>Marka: *</label>
                  <input
                    type="text"
                    name="deviceBrand"
                    value={formData.deviceBrand}
                    onChange={handleChange}
                    placeholder="np. Dell, Apple, HP"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Model: *</label>
                  <input
                    type="text"
                    name="deviceModel"
                    value={formData.deviceModel}
                    onChange={handleChange}
                    placeholder="np. XPS 13, MacBook Pro"
                    required
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
            )}

            <div className="form-group" style={{ marginTop: '15px' }}>
              <label>Asset Tag (numer wewnętrzny):</label>
              <input
                type="text"
                name="assetTag"
                value={formData.assetTag}
                onChange={handleChange}
                placeholder="np. AST-12345"
              />
              <small style={{ color: '#999' }}>
                Wewnętrzny numer identyfikacyjny urządzenia w serwisie
              </small>
            </div>
          </div>
        )}

        {/* Opis problemu */}
        <div className="form-section">
          <h3>3️⃣ Opis problemu</h3>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Opisz dokładnie problem z urządzeniem..."
            required
            rows="5"
          />
        </div>

        {/* ============= ZDJĘCIE ============= */}
        <div className="form-section">
          <h3>📸 Zdjęcie urządzenia (opcjonalnie)</h3>

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
            Maksymalny rozmiar: 5MB
          </small>
        </div>

        {/* Przypisanie technika */}
        <div className="form-section">
          <h3>4️⃣ Przypisanie technika</h3>
          <div className="form-group">
            <label>Technik:</label>
            <select name="technicianId" value={formData.technicianId} onChange={handleChange}>
              <option value="auto">🤖 Automatycznie (load balancing)</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.fullName} ({tech.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Tworzenie zgłoszenia...' : 'Zarejestruj zgłoszenie'}
        </button>
      </form>
    </div>
  );
};
