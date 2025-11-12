import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

// Upload zdjęcia
export const uploadImage = async (file, ticketId) => {
  try {
    if (!file) throw new Error('Brak pliku');

    // Walidacja pliku
    if (!file.type.startsWith('image/')) {
      throw new Error('Plik musi być obrazem');
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      throw new Error('Plik jest zbyt duży (max 5MB)');
    }

    // Utwórz unikalną ścieżkę
    const timestamp = Date.now();
    const filename = `${file.name.split('.')[0]}-${timestamp}.${file.name.split('.').pop()}`;
    const storagePath = `tickets/${ticketId}/${filename}`;

    // Upload
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);

    // Pobierz URL
    const downloadURL = await getDownloadURL(storageRef);

    console.log('✅ Image uploaded:', downloadURL);
    return {
      url: downloadURL,
      path: storagePath,
      filename: filename,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Usuń zdjęcie
export const deleteImage = async (storagePath) => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
    console.log('✅ Image deleted');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Pobierz listę zdjęć dla ticketu
export const getTicketImages = async (ticketId) => {
  try {
    const folderRef = ref(storage, `tickets/${ticketId}`);
    const result = await listAll(folderRef);

    const images = [];
    for (const fileRef of result.items) {
      const url = await getDownloadURL(fileRef);
      images.push({
        url: url,
        path: fileRef.fullPath,
        name: fileRef.name,
      });
    }

    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};
