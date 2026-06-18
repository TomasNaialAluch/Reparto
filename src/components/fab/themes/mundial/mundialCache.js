import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../../../firebase/config';
import { fetchMundialLiveData } from './mundialApi';

const CACHE_KEY = 'fab-mundial-live-v1';
const FIRESTORE_DOC = doc(db, 'cache', 'mundial2026');
export const MUNDIAL_CACHE_TTL_MS = 15 * 60 * 1000;

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

const isStale = (fetchedAt) => Date.now() - fetchedAt >= MUNDIAL_CACHE_TTL_MS;

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
export const getMundialCacheEntry = () => {
  if (memoryCache) return memoryCache;
  const stored = readStorage();
  if (stored) memoryCache = stored;
  return memoryCache;
};

export const setMundialCache = (data, fetchedAt = Date.now()) => {
  const entry = { data, fetchedAt };
  memoryCache = entry;
  writeStorage(entry);
  listeners.forEach((fn) => fn(data));
  return entry;
};

const readMundialFromFirestore = async () => {
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

const writeMundialToFirestore = async (data, fetchedAt) => {
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
export const hydrateMundialCacheFromFirestore = async () => {
  const remote = await readMundialFromFirestore();
  if (!remote) return false;

  const local = getMundialCacheEntry();
  if (!local || remote.fetchedAt >= local.fetchedAt) {
    setMundialCache(remote.data, remote.fetchedAt);
    return true;
  }

  return false;
};

export const subscribeMundialCache = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Obtiene datos del Mundial: local → Firestore → API externa.
 * @param {{ force?: boolean }} [opts]
 */
export const loadMundialData = async ({ force = false } = {}) => {
  const cached = getMundialCacheEntry();
  if (!force && cached && !isStale(cached.fetchedAt)) {
    return cached.data;
  }

  if (!force) {
    const remote = await readMundialFromFirestore();
    if (remote && !isStale(remote.fetchedAt)) {
      setMundialCache(remote.data, remote.fetchedAt);
      return remote.data;
    }
  }

  if (inflight) return inflight;

  inflight = fetchMundialLiveData()
    .then(async (data) => {
      const fetchedAt = Date.now();
      setMundialCache(data, fetchedAt);
      await writeMundialToFirestore(data, fetchedAt);
      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

export const ensureMundialBackgroundRefresh = () => {
  if (!refreshTimer) {
    refreshTimer = setInterval(() => {
      loadMundialData({ force: true }).catch(() => {});
    }, MUNDIAL_CACHE_TTL_MS);
  }

  if (!visibilityBound && typeof document !== 'undefined') {
    visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && isMundialCacheStale()) {
        loadMundialData({ force: true }).catch(() => {});
      }
    });
  }
};

/** Arranque: caché local + Firestore + refresh si venció (Firebase Hosting). */
export const initMundialCache = () => {
  getMundialCacheEntry();
  ensureMundialBackgroundRefresh();

  if (!authBound) {
    authBound = true;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        hydrateMundialCacheFromFirestore().then((hydrated) => {
          if (!hydrated && isMundialCacheStale()) {
            loadMundialData().catch(() => {});
          }
        });
      }
    });
  }

  if (auth.currentUser) {
    hydrateMundialCacheFromFirestore().catch(() => {});
  }

  if (isMundialCacheStale()) {
    loadMundialData().catch(() => {});
  }
};

export const clearMundialBackgroundRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

export const isMundialCacheStale = () => {
  const entry = getMundialCacheEntry();
  return !entry || isStale(entry.fetchedAt);
};

export const getMundialCacheFetchedAt = () => getMundialCacheEntry()?.fetchedAt ?? null;
