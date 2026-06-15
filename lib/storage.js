(function (global) {
  const DB_NAME = "tabguard_db";
  const DB_VERSION = 1;
  const PAGE_STORE = "pages";
  const SETTINGS_STORE = "settings";

  const { DEFAULT_SETTINGS, normalizeUrl } = global.TabGuardUtils || {};

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(PAGE_STORE)) {
          const pages = db.createObjectStore(PAGE_STORE, {
            keyPath: "id",
            autoIncrement: true
          });
          pages.createIndex("url", "url", { unique: true });
          pages.createIndex("category", "category", { unique: false });
          pages.createIndex("expiresAt", "expiresAt", { unique: false });
          pages.createIndex("savedAt", "savedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: "key" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function transaction(storeName, mode, callback) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let result;

      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };

      try {
        result = callback(store);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getAllPages() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PAGE_STORE, "readonly");
      const index = tx.objectStore(PAGE_STORE).index("savedAt");
      const request = index.openCursor(null, "prev");
      const pages = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          pages.push(cursor.value);
          cursor.continue();
        } else {
          resolve(pages);
        }
      };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function getPageByUrl(url) {
    const normalized = normalizeUrl ? normalizeUrl(url) : url;
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PAGE_STORE, "readonly");
      const request = tx.objectStore(PAGE_STORE).index("url").get(normalized);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function upsertPage(page) {
    const url = normalizeUrl ? normalizeUrl(page.url) : page.url;
    const existing = await getPageByUrl(url);
    const payload = {
      ...existing,
      ...page,
      url,
      updatedAt: Date.now()
    };

    if (!payload.savedAt) {
      payload.savedAt = Date.now();
    }

    await transaction(PAGE_STORE, "readwrite", (store) => {
      store.put(payload);
    });

    return getPageByUrl(url);
  }

  async function deletePage(id) {
    return transaction(PAGE_STORE, "readwrite", (store) => {
      store.delete(Number(id));
    });
  }

  async function deletePageByUrl(url) {
    const page = await getPageByUrl(url);
    if (!page) {
      return false;
    }

    await deletePage(page.id);
    return true;
  }

  async function resetExpiry(id, expiresAt) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PAGE_STORE, "readwrite");
      const store = tx.objectStore(PAGE_STORE);
      const getRequest = store.get(Number(id));
      let updatedPage = null;

      getRequest.onsuccess = () => {
        const page = getRequest.result;
        if (!page) {
          return;
        }

        page.expiresAt = expiresAt;
        page.updatedAt = Date.now();
        store.put(page);
        updatedPage = page;
      };

      getRequest.onerror = () => reject(getRequest.error);
      tx.oncomplete = () => {
        db.close();
        resolve(updatedPage);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function clearPages() {
    return transaction(PAGE_STORE, "readwrite", (store) => {
      store.clear();
    });
  }

  async function getSetting(key) {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, "readonly");
      const request = tx.objectStore(SETTINGS_STORE).get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function setSetting(key, value) {
    return transaction(SETTINGS_STORE, "readwrite", (store) => {
      store.put({ key, value });
    });
  }

  async function getSettings() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, "readonly");
      const request = tx.objectStore(SETTINGS_STORE).getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        const settings = { ...(DEFAULT_SETTINGS || {}) };
        records.forEach((record) => {
          settings[record.key] = record.value;
        });
        resolve(settings);
      };

      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  async function setSettings(settings) {
    const entries = Object.entries(settings);

    return transaction(SETTINGS_STORE, "readwrite", (store) => {
      entries.forEach(([key, value]) => {
        store.put({ key, value });
      });
    });
  }

  async function countPages() {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PAGE_STORE, "readonly");
      const request = tx.objectStore(PAGE_STORE).count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  }

  global.TabGuardStorage = {
    clearPages,
    countPages,
    deletePage,
    deletePageByUrl,
    getAllPages,
    getPageByUrl,
    getSetting,
    getSettings,
    requestToPromise,
    resetExpiry,
    setSetting,
    setSettings,
    upsertPage
  };
})(globalThis);
