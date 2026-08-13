// IndexedDB ラッパー
// items: 書類・保証書・公共料金レコードを1つのストアにまとめて保存
// category: 'document' | 'warranty' | 'utility'

const DB_NAME = 'money-docs-tracker';
const DB_VERSION = 1;
const STORE_ITEMS = 'items';
const STORE_FILES = 'files';

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ITEMS)) {
        const itemStore = db.createObjectStore(STORE_ITEMS, { keyPath: 'id' });
        itemStore.createIndex('category', 'category', { unique: false });
        itemStore.createIndex('dueDate', 'dueDate', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_FILES)) {
        const fileStore = db.createObjectStore(STORE_FILES, { keyPath: 'id' });
        fileStore.createIndex('itemId', 'itemId', { unique: false });
      }
    };
    req.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function uid() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

async function tx(storeName, mode) {
  const db = await openDB();
  return db.transaction(storeName, mode).objectStore(storeName);
}

// ---- items ----

async function putItem(item) {
  const store = await tx(STORE_ITEMS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(item);
    req.onsuccess = () => resolve(item);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getAllItems() {
  const store = await tx(STORE_ITEMS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getItem(id) {
  const store = await tx(STORE_ITEMS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteItem(id) {
  const store = await tx(STORE_ITEMS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

// ---- files (取説・保証書の写真/PDFなど、1アイテムに複数ひもづく) ----

async function addFile(itemId, name, mimeType, blob) {
  const store = await tx(STORE_FILES, 'readwrite');
  const file = { id: uid(), itemId, name, mimeType, blob, createdAt: Date.now() };
  return new Promise((resolve, reject) => {
    const req = store.put(file);
    req.onsuccess = () => resolve(file);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function getFilesForItem(itemId) {
  const store = await tx(STORE_FILES, 'readonly');
  const idx = store.index('itemId');
  return new Promise((resolve, reject) => {
    const req = idx.getAll(itemId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function deleteFile(fileId) {
  const store = await tx(STORE_FILES, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(fileId);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

window.db = {
  uid,
  putItem,
  getAllItems,
  getItem,
  deleteItem,
  addFile,
  getFilesForItem,
  deleteFile,
};
