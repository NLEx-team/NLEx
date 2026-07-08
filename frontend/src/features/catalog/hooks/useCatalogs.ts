import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../api';
import type { CatalogRead, CatalogCreate, CatalogTestResult, CatalogSyncStatus } from '../types';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, CatalogTestResult>>({});
  const [syncStatuses, setSyncStatuses] = useState<Record<string, CatalogSyncStatus>>({});

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.list();
      setCatalogs(data);
      
      // Initialize sync statuses for all catalogs
      const statuses: Record<string, CatalogSyncStatus> = {};
      await Promise.all(data.map(async (c) => {
        try {
          statuses[c.id] = await catalogApi.syncStatus(c.id);
        } catch {
          // ignore
        }
      }));
      setSyncStatuses(statuses);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  // Polling for syncing catalogs
  useEffect(() => {
    const syncingIds = catalogs
      .filter(c => syncStatuses[c.id] && !syncStatuses[c.id].is_cached && syncStatuses[c.id].is_syncing)
      .map(c => c.id);

    if (syncingIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const id of syncingIds) {
        try {
          const status = await catalogApi.syncStatus(id);
          setSyncStatuses(prev => ({ ...prev, [id]: status }));
        } catch {
          // ignore
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [catalogs, syncStatuses]);

  const createCatalog = async (data: CatalogCreate) => {
    const newCatalog = await catalogApi.create(data);
    setCatalogs(prev => [...prev, newCatalog]);
    try {
      const status = await catalogApi.syncStatus(newCatalog.id);
      setSyncStatuses(prev => ({ ...prev, [newCatalog.id]: status }));
    } catch {
      // ignore
    }
  };

  const deleteCatalog = async (id: string) => {
    await catalogApi.delete(id);
    setCatalogs(prev => prev.filter(c => c.id !== id));
  };

  const testCatalog = async (id: string) => {
    const updated = await catalogApi.test(id);
    setCatalogs(prev => prev.map(c => c.id === id ? updated : c));
    try {
      const status = await catalogApi.syncStatus(id);
      setSyncStatuses(prev => ({ ...prev, [id]: status }));
    } catch {
      // ignore
    }
  };

  const pingCatalog = async (id: string): Promise<CatalogTestResult> => {
    const result = await catalogApi.ping(id);
    setPingResults(prev => ({ ...prev, [id]: result }));
    // Also update the catalog status based on ping result
    setCatalogs(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: result.success ? 'active' : 'error' };
      }
      return c;
    }));
    return result;
  };

  const pingAllCatalogs = async () => {
    const results: Record<string, CatalogTestResult> = {};
    for (const catalog of catalogs) {
      try {
        const result = await catalogApi.ping(catalog.id);
        results[catalog.id] = result;
      } catch {
        results[catalog.id] = { success: false, latency_ms: null, error: 'Ping failed' };
      }
    }
    setPingResults(results);
    // Update statuses
    setCatalogs(prev => prev.map(c => {
      const r = results[c.id];
      if (r) {
        return { ...c, status: r.success ? 'active' : 'error' };
      }
      return c;
    }));
  };

  return { catalogs, loading, error, pingResults, syncStatuses, fetchCatalogs, createCatalog, deleteCatalog, testCatalog, pingCatalog, pingAllCatalogs };
}
