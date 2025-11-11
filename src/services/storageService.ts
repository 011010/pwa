/**
 * Storage Service
 *
 * Handles local storage of photos and signatures using IndexedDB.
 * Provides persistent storage that works offline and survives page reloads.
 */

const DB_NAME = 'itam_storage';
const DB_VERSION = 1;
const PHOTOS_STORE = 'photos';
const SIGNATURES_STORE = 'signatures';

/**
 * Photo storage interface
 */
export interface StoredPhoto {
  id: string;
  assetId: number;
  file: File;
  dataUrl: string;
  uploadedAt: string;
  uploaded: boolean; // Flag to track if uploaded to server
}

/**
 * Signature storage interface
 */
export interface StoredSignature {
  id: string;
  assetId: number;
  dataUrl: string;
  signedBy: string;
  signedAt: string;
  action: string;
  uploaded: boolean; // Flag to track if uploaded to server
}

/**
 * Initialize IndexedDB
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create photos store
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        const photosStore = db.createObjectStore(PHOTOS_STORE, { keyPath: 'id' });
        photosStore.createIndex('assetId', 'assetId', { unique: false });
        photosStore.createIndex('uploaded', 'uploaded', { unique: false });
      }

      // Create signatures store
      if (!db.objectStoreNames.contains(SIGNATURES_STORE)) {
        const signaturesStore = db.createObjectStore(SIGNATURES_STORE, { keyPath: 'id' });
        signaturesStore.createIndex('assetId', 'assetId', { unique: false });
        signaturesStore.createIndex('uploaded', 'uploaded', { unique: false });
      }
    };
  });
};

/**
 * Convert File to Data URL for storage
 */
const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Save photo to IndexedDB
 */
export const savePhoto = async (assetId: number, file: File): Promise<StoredPhoto> => {
  const db = await openDB();
  const dataUrl = await fileToDataURL(file);

  const photo: StoredPhoto = {
    id: `photo_${assetId}_${Date.now()}`,
    assetId,
    file,
    dataUrl,
    uploadedAt: new Date().toISOString(),
    uploaded: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.add(photo);

    request.onsuccess = () => {
      console.log('[Storage] Photo saved:', photo.id);
      resolve(photo);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all photos for an asset
 */
export const getPhotos = async (assetId: number): Promise<StoredPhoto[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readonly');
    const store = transaction.objectStore(PHOTOS_STORE);
    const index = store.index('assetId');
    const request = index.getAll(assetId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete photo
 */
export const deletePhoto = async (photoId: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const request = store.delete(photoId);

    request.onsuccess = () => {
      console.log('[Storage] Photo deleted:', photoId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save signature to IndexedDB
 */
export const saveSignature = async (
  assetId: number,
  dataUrl: string,
  signedBy: string,
  action: string
): Promise<StoredSignature> => {
  const db = await openDB();

  const signature: StoredSignature = {
    id: `signature_${assetId}_${Date.now()}`,
    assetId,
    dataUrl,
    signedBy,
    signedAt: new Date().toISOString(),
    action,
    uploaded: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SIGNATURES_STORE], 'readwrite');
    const store = transaction.objectStore(SIGNATURES_STORE);
    const request = store.add(signature);

    request.onsuccess = () => {
      console.log('[Storage] Signature saved:', signature.id);
      resolve(signature);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Get all signatures for an asset
 */
export const getSignatures = async (assetId: number): Promise<StoredSignature[]> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SIGNATURES_STORE], 'readonly');
    const store = transaction.objectStore(SIGNATURES_STORE);
    const index = store.index('assetId');
    const request = index.getAll(assetId);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Delete signature
 */
export const deleteSignature = async (signatureId: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SIGNATURES_STORE], 'readwrite');
    const store = transaction.objectStore(SIGNATURES_STORE);
    const request = store.delete(signatureId);

    request.onsuccess = () => {
      console.log('[Storage] Signature deleted:', signatureId);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Mark photo as uploaded
 */
export const markPhotoAsUploaded = async (photoId: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PHOTOS_STORE], 'readwrite');
    const store = transaction.objectStore(PHOTOS_STORE);
    const getRequest = store.get(photoId);

    getRequest.onsuccess = () => {
      const photo = getRequest.result;
      if (photo) {
        photo.uploaded = true;
        const putRequest = store.put(photo);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

/**
 * Mark signature as uploaded
 */
export const markSignatureAsUploaded = async (signatureId: string): Promise<void> => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SIGNATURES_STORE], 'readwrite');
    const store = transaction.objectStore(SIGNATURES_STORE);
    const getRequest = store.get(signatureId);

    getRequest.onsuccess = () => {
      const signature = getRequest.result;
      if (signature) {
        signature.uploaded = true;
        const putRequest = store.put(signature);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const storageService = {
  savePhoto,
  getPhotos,
  deletePhoto,
  saveSignature,
  getSignatures,
  deleteSignature,
  markPhotoAsUploaded,
  markSignatureAsUploaded,
};

export default storageService;
