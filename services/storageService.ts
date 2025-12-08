
import { StoredFile } from "../types";

const DB_NAME = 'aura_gallery_db';
const STORE_IMAGES = 'images';
const STORE_FILES = 'user_files'; // New Store for Vault

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // Version bumped to 2
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES);
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  // --- IMAGES (Key-Value) ---
  saveImage: async (key: string, base64Data: string): Promise<void> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.put(base64Data, key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error("IDB Save Error", e);
    }
  },

  getImage: async (key: string): Promise<string | null> => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readonly');
      const store = tx.objectStore(STORE_IMAGES);
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error("IDB Load Error", e);
      return null;
    }
  },
  
  clearImage: async (key: string): Promise<void> => {
       try {
      const db = await openDB();
      const tx = db.transaction(STORE_IMAGES, 'readwrite');
      const store = tx.objectStore(STORE_IMAGES);
      store.delete(key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error("IDB Delete Error", e);
    }
  },

  // --- FILES (Digital Vault) ---
  saveFile: async (file: StoredFile): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_FILES, 'readwrite');
          const store = tx.objectStore(STORE_FILES);
          store.put(file);
          return new Promise((resolve, reject) => {
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
          });
      } catch (e) { console.error("Vault Save Error", e); }
  },

  getAllFiles: async (): Promise<StoredFile[]> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_FILES, 'readonly');
          const store = tx.objectStore(STORE_FILES);
          const request = store.getAll();
          return new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result || []);
              request.onerror = () => reject(request.error);
          });
      } catch (e) { return []; }
  },

  getFile: async (id: string): Promise<StoredFile | undefined> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_FILES, 'readonly');
          const store = tx.objectStore(STORE_FILES);
          const request = store.get(id);
          return new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
          });
      } catch (e) { return undefined; }
  }
};
