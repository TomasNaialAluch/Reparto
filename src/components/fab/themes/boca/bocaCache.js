import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../../firebase/config';
import { fetchBocaLiveData } from './bocaApi';

const CACHE_KEY = 'fab-boca-live-v1';
const FIRESTORE_DOC = doc(db, 'cache', 'boca');
export const BOCA_CACHE_TTL_MS = 15 * 60 * 1000;

/** @type {{ data: object, fetchedAt: number } | null} */
let memoryCache = null;
/** @type {ReturnType<typeof setInterval> | null} */
let refreshTimer = null;
let visibilityBound = false;
let authBound = false;
/** @type {Set<(data: object) => void>} */
const listeners = new Set();
/** @type {Promise<object> | null} */
let inflight = null;

const isStale = (fetchedAt) => Date.now() - fetchedAt >= BOCA_CACHE_TTL_MS;

const readStorage = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeStorage = (entry) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / modo privado */
  }
};

/** Devuelve caché en memoria o localStorage (aunque esté vencida). */
export const getBocaCacheEntry = () => {
  if (memoryCache) return memoryCache;
  const stored = readStorage();
  if (stored) memoryCache = stored;
  return memoryCache;
};

export const setBocaCache = (data, fetchedAt = Date.now()) => {
  const entry = { data, fetchedAt };
  memoryCache = entry;
  writeStorage(entry);
  listeners.forEach((fn) => fn(data));
  return entry;
};

const readBocaFromFirestore = async () => {
  if (!auth.currentUser) return null;

  try {
    const snap = await getDoc(FIRESTORE_DOC);
    if (!snap.exists()) return null;

    const { data, fetchedAt } = snap.data();
    if (!data) return null;

    const ms =
      typeof fetchedAt === 'number'
        ? fetchedAt
        : fetchedAt?.toMillis?.() ?? null;

    if (!ms) return null;
    return { data, fetchedAt: ms };
  } catch {
    return null;
  }
};

const writeBocaToFirestore = async (data, fetchedAt) => {
  if (!auth.currentUser) return;

  try {
    await setDoc(
      FIRESTORE_DOC,
      {
        data,
        fetchedAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    /* sin permisos o sin red */
  }
};

/** Sincroniza caché local con Firestore (producción Firebase). */
export const hydrateBocaCacheFromFirestore = async () => {
  const remote = await readBocaFromFirestore();
  if (!remote) return false;

  const local = getBocaCacheEntry();
  if (!local || remote.fetchedAt >= local.fetchedAt) {
    setBocaCache(remote.data, remote.fetchedAt);
    return true;
  }

  return false;
};

export const subscribeBocaCache = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Obtiene datos de Boca: local → Firestore → API externa.
 * @param {{ force?: boolean }} [opts]
 */
export const loadBocaData = async ({ force = false } = {}) => {
  const cached = getBocaCacheEntry();
  if (!force && cached && !isStale(cached.fetchedAt)) {
    return cached.data;
  }

  if (!force) {
    const remote = await readBocaFromFirestore();
    if (remote && !isStale(remote.fetchedAt)) {
      setBocaCache(remote.data, remote.fetchedAt);
      return remote.data;
    }
  }

  if (inflight) return inflight;

  inflight = fetchBocaLiveData()
    .then(async (data) => {
      const fetchedAt = Date.now();
      setBocaCache(data, fetchedAt);
      await writeBocaToFirestore(data, fetchedAt);
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

export const ensureBocaBackgroundRefresh = () => {
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      loadBocaData({ force: true }).catch(() => {});
    }, BOCA_CACHE_TTL_MS);
  }

  if (!visibilityBound && typeof document !== 'undefined') {
    visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isBocaCacheStale()) {
        loadBocaData({ force: true }).catch(() => {});
      }
    });
  }
};

/** Arranque: caché local + Firestore + refresh si venció (Firebase Hosting). */
export const initBocaCache = () => {
  getBocaCacheEntry();
  ensureBocaBackgroundRefresh();

  if (!authBound) {
    authBound = true;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        hydrateBocaCacheFromFirestore().then((hydrated) => {
          if (!hydrated && isBocaCacheStale()) {
            loadBocaData().catch(() => {});
          }
        });
      }
    });
  }

  if (auth.currentUser) {
    hydrateBocaCacheFromFirestore().catch(() => {});
  }

  if (isBocaCacheStale()) {
    loadBocaData().catch(() => {});
  }
};

export const clearBocaBackgroundRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

export const isBocaCacheStale = () => {
  const entry = getBocaCacheEntry();
  return !entry || isStale(entry.fetchedAt);
};

export const getBocaCacheFetchedAt = () => getBocaCacheEntry()?.fetchedAt ?? null;
