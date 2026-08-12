/**
 * idb-storage.ts
 * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, decyzja: pełna migracja zapisów
 * na IndexedDB). Cienki, Promise-based wrapper nad natywnym IndexedDB, dający
 * save.ts prosty klucz->wartość interfejs (string in, string out) zamiast
 * localStorage.{getItem,setItem,removeItem,key/length}. Powód migracji:
 * 10 rotacyjnych slotów autozapisu z pełną mapą (mapSnapshot) w KAŻDYM
 * przekracza budżet localStorage (~5-10 MB/domenę) nawet po kompresji
 * kolumnowej (8,2x) -- IndexedDB nie ma tego niskiego, twardego limitu.
 * / EN: thin Promise-based wrapper over native IndexedDB, giving save.ts a
 * plain key->value interface (string in, string out) instead of
 * localStorage.{getItem,setItem,removeItem,key/length}. Migration reason: 10
 * rotating autosave slots with a full map snapshot in EACH exceed the
 * localStorage budget (~5-10 MB/origin) even after columnar compression
 * (8.2x) -- IndexedDB has no such low, hard limit.
 *
 * Kontrakt (celowo minimalny -- YAGNI, brak kursorów/indeksów, tylko to,
 * czego realnie potrzebuje save.ts):
 *   idbGetItem(key)    -> Promise<string|null>  -- NIGDY nie rzuca; null przy
 *                          braku klucza, niedostępności IndexedDB lub błędzie.
 *   idbSetItem(key, v) -> Promise<void>          -- REJECTuje przy błędzie
 *                          (w tym niedostępności IndexedDB) -- save.ts::
 *                          saveToLocal() musi odróżnić sukces od porażki
 *                          (i quota od innej przyczyny), więc w przeciwieństwie
 *                          do odczytów to NIE może być cicha porażka.
 *   idbRemoveItem(key) -> Promise<void>          -- NIGDY nie rzuca (best-
 *                          effort, jak storage.removeItem() dziś w deleteLocal).
 *   idbListKeys()      -> Promise<string[]>      -- NIGDY nie rzuca; [] przy
 *                          niedostępności/błędzie.
 * / EN: contract (deliberately minimal -- YAGNI, no cursors/indexes, only
 * what save.ts actually needs):
 *   idbGetItem/idbListKeys never throw/reject (silent failure, mirrors
 *   getStorage() returning null today); idbSetItem rejects on failure
 *   (including unavailability) because saveToLocal() must distinguish
 *   success from failure (and quota from other) -- unlike reads, this can't
 *   be silent; idbRemoveItem never rejects (best-effort, like
 *   storage.removeItem() in deleteLocal today).
 */

const DB_NAME = 'thegame-saves';
const DB_VERSION = 1;
const STORE_NAME = 'kv';

/**
 * Otwiera (i memoizuje) połączenie do bazy. Cache'ujemy Promise, nie sam
 * wynik -- kolejne wywołania w trakcie otwierania czekają na TO SAMO
 * otwarcie zamiast każde odpalać własny indexedDB.open().
 * / EN: opens (and memoizes) the DB connection. We cache the Promise, not
 * the resolved value -- concurrent calls while opening await the SAME open
 * instead of each firing its own indexedDB.open().
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    let idb: IDBFactory | undefined;
    try {
      idb = typeof indexedDB === 'undefined' ? undefined : indexedDB;
    } catch {
      idb = undefined;
    }
    if (!idb) { resolve(null); return; }
    try {
      const req = idb.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Odczyt klucza. Cicha porażka (jak getStorage() dziś) -- null przy braku/błędzie. */
export async function idbGetItem(key: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const v = req.result;
        resolve(typeof v === 'string' ? v : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Zapis klucza. REJECTuje na błędzie (w tym brak IndexedDB) -- wołający
 * (saveToLocal) łapie to identycznie jak dziś łapie throw z
 * storage.setItem(), łącznie z rozróżnieniem quota/other (patrz
 * isQuotaExceededError w save.ts, działa na dowolnym obiekcie z .name/.code,
 * więc i na DOMException z IndexedDB).
 */
export async function idbSetItem(key: string, value: string): Promise<void> {
  const db = await openDb();
  if (!db) throw new Error('idb-storage: IndexedDB niedostepne');
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('idb-storage: zapis nieudany'));
      tx.onabort = () => reject(tx.error ?? new Error('idb-storage: transakcja przerwana (prawdopodobnie quota)'));
    } catch (err) {
      reject(err);
    }
  });
}

/** Usunięcie klucza. Best-effort, nigdy nie rzuca (jak deleteLocal dziś). */
export async function idbRemoveItem(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Wszystkie klucze w magazynie. Cicha porażka -- [] przy niedostępności/błędzie. */
export async function idbListKeys(): Promise<string[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        const keys = req.result as IDBValidKey[];
        resolve(keys.map((k) => String(k)));
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}
