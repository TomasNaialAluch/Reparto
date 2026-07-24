import { useCallback, useEffect, useState } from 'react';
import {
  ensureBocaBackgroundRefresh,
  getBocaCacheEntry,
  isBocaCacheStale,
  loadBocaData,
  subscribeBocaCache,
} from './bocaCache';

/**
 * Datos de Boca Juniors con caché (memoria + localStorage).
 * Al abrir el panel muestra lo guardado al instante; refresca si venció (>15 min).
 */
export const useBocaLiveData = () => {
  const initial = getBocaCacheEntry();

  const [data, setData] = useState(initial?.data ?? null);
  const [loading, setLoading] = useState(!initial?.data);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    const hasCache = Boolean(getBocaCacheEntry()?.data);

    if (!hasCache) setLoading(true);
    else setRefreshing(true);

    try {
      const next = await loadBocaData({ force });
      setData(next);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (!hasCache) {
          setError('No se pudieron cargar los datos de Boca. Reintentá en un momento.');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    ensureBocaBackgroundRefresh();

    const unsub = subscribeBocaCache((payload) => {
      if (payload?.__error) return;
      setData(payload);
      setError(null);
      setLoading(false);
      setRefreshing(false);
    });

    if (isBocaCacheStale()) {
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
