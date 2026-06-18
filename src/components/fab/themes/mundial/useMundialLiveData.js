import { useCallback, useEffect, useState } from 'react';
import {
  ensureMundialBackgroundRefresh,
  getMundialCacheEntry,
  isMundialCacheStale,
  loadMundialData,
  subscribeMundialCache,
} from './mundialCache';

/**
 * Datos del Mundial con caché (memoria + localStorage).
 * Al abrir el panel muestra lo guardado al instante; refresca si venció (>15 min).
 */
export const useMundialLiveData = () => {
  const initial = getMundialCacheEntry();

  const [data, setData] = useState(initial?.data ?? null);
  const [loading, setLoading] = useState(!initial?.data);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    const hasCache = Boolean(getMundialCacheEntry()?.data);

    if (!hasCache) setLoading(true);
    else setRefreshing(true);

    try {
      const next = await loadMundialData({ force });
      setData(next);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (!hasCache) {
          setError('No se pudieron cargar los datos del Mundial. Reintentá en un momento.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    ensureMundialBackgroundRefresh();

    const unsub = subscribeMundialCache((payload) => {
      if (payload?.__error) return;
      setData(payload);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    });

    if (isMundialCacheStale()) {
      load(true);
    }

    return unsub;
  }, [load]);

  return {
    data,
    loading,
    error,
    refreshing,
    reload: () => load(true),
  };
};
