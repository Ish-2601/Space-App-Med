// Photo storage. Images are kept in IndexedDB (too big for localStorage);
// the list of photos (date, category, notes) lives in the main state.
const DB_NAME = "astrohealth-photos";
const STORE = "photos";
const memory = new Map(); // fallback if IndexedDB is unavailable

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function putPhoto(id, blob) {
  try {
    await run("readwrite", (s) => s.put(blob, id));
  } catch {
    memory.set(id, blob);
  }
}

export async function getPhoto(id) {
  try {
    const blob = await run("readonly", (s) => s.get(id));
    return blob || memory.get(id) || null;
  } catch {
    return memory.get(id) || null;
  }
}

export async function removePhoto(id) {
  memory.delete(id);
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch {
    // ignore
  }
}

export async function clearPhotos() {
  memory.clear();
  try {
    await run("readwrite", (s) => s.clear());
  } catch {
    // ignore
  }
}
