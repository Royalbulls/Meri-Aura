
import { StoredFile, Project, Contact } from "../types";

const DB_NAME = 'aura_gallery_db';
const STORE_IMAGES = 'images';
const STORE_FILES = 'user_files'; 
const STORE_PROJECTS = 'user_projects'; 
const STORE_CONTACTS = 'user_contacts';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 4); // Version bumped to 4 for contacts
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES);
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        db.createObjectStore(STORE_FILES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CONTACTS)) {
        db.createObjectStore(STORE_CONTACTS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const storageService = {
  // --- IMAGES ---
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
      return null;
    }
  },

  // --- PROJECTS ---
  saveProject: async (project: Project): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_PROJECTS, 'readwrite');
          const store = tx.objectStore(STORE_PROJECTS);
          store.put(project);
          return new Promise((resolve, reject) => {
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
          });
      } catch (e) { console.error("Project Save Error", e); }
  },

  getAllProjects: async (): Promise<Project[]> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_PROJECTS, 'readonly');
          const store = tx.objectStore(STORE_PROJECTS);
          const request = store.getAll();
          return new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result || []);
              request.onerror = () => reject(request.error);
          });
      } catch (e) { return []; }
  },

  deleteProject: async (id: string): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_PROJECTS, 'readwrite');
          const store = tx.objectStore(STORE_PROJECTS);
          store.delete(id);
      } catch (e) {}
  },

  // --- CONTACTS (CRM REAL DATA) ---
  saveContact: async (contact: Contact): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_CONTACTS, 'readwrite');
          const store = tx.objectStore(STORE_CONTACTS);
          store.put(contact);
      } catch (e) { console.error("Contact Save Error", e); }
  },

  getAllContacts: async (): Promise<Contact[]> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_CONTACTS, 'readonly');
          const store = tx.objectStore(STORE_CONTACTS);
          const request = store.getAll();
          return new Promise((resolve, reject) => {
              request.onsuccess = () => resolve(request.result || []);
              request.onerror = () => reject(request.error);
          });
      } catch (e) { return []; }
  },

  deleteContact: async (id: string): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_CONTACTS, 'readwrite');
          tx.objectStore(STORE_CONTACTS).delete(id);
      } catch (e) {}
  },

  // --- FILES ---
  saveFile: async (file: StoredFile): Promise<void> => {
      try {
          const db = await openDB();
          const tx = db.transaction(STORE_FILES, 'readwrite');
          const store = tx.objectStore(STORE_FILES);
          store.put(file);
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
  }
};
