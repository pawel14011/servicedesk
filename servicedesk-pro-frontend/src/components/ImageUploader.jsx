import { useState } from 'react';
import { uploadImage, deleteImage } from '../services/storageService';
import { addImageToTicket, removeImageFromTicket } from '../services/ticketService';
import '../styles/image-uploader.css';

export const ImageUploader = ({ ticketId, onImagesChange }) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // 1. Upload do Storage
      const imageData = await uploadImage(file, ticketId);

      // 2. Dodaj do ticketu w Firestore
      await addImageToTicket(ticketId, imageData);

      // 3. Dodaj do lokalnej listy
      setImages([...images, imageData]);

      // 4. Powiadom parent component
      if (onImagesChange) {
        onImagesChange([...images, imageData]);
      }

      console.log('✅ Image processed successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
      e.target.value = ''; // Zresetuj input
    }
  };

  const handleDeleteImage = async (imageData) => {
    if (!window.confirm('Usunąć to zdjęcie?')) return;

    try {
      // 1. Usuń z Storage
      await deleteImage(imageData.path);

      // 2. Usuń z ticketu w Firestore
      await removeImageFromTicket(ticketId, imageData.path);

      // 3. Usuń z lokalnej listy
      const updatedImages = images.filter((img) => img.path !== imageData.path);
      setImages(updatedImages);

      // 4. Powiadom parent
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }

      console.log('✅ Image deleted successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting image:', err);
    }
  };

  return (
    <div className="image-uploader">
      {error && <div className="error-message">{error}</div>}

      <div className="upload-section">
        <label className="upload-label">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <span className="upload-button">
            {uploading ? '⏳ Uploading...' : '📷 Dodaj zdjęcie'}
          </span>
        </label>
        <small style={{ color: '#999', display: 'block', marginTop: '5px' }}>
          Maksymalny rozmiar: 5MB. Obsługiwane: JPG, PNG, GIF
        </small>
      </div>

      {images.length > 0 && (
        <div className="gallery">
          <h4>Galeria ({images.length})</h4>
          <div className="gallery-grid">
            {images.map((image, idx) => (
              <div key={idx} className="gallery-item">
                <img src={image.url} alt={`Zdjęcie ${idx + 1}`} />
                <div className="gallery-overlay">
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-view-full"
                  >
                    👁️ Pełny rozmiar
                  </a>
                  <button onClick={() => handleDeleteImage(image)} className="btn-delete">
                    🗑️ Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
