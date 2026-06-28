import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../api';
import type { CatalogRead, CatalogCreate, CatalogTestResult } from '../types';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, CatalogTestResult>>({});

  const fetchCatalogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await catalogApi.list();
      setCatalogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  const createCatalog = async (data: CatalogCreate) => {
    await catalogApi.create(data);
    await fetchCatalogs();
  };

  const deleteCatalog = async (id: string) => {
    await catalogApi.delete(id);
    setCatalogs(prev => prev.filter(c => c.id !== id));
  };

  const testCatalog = async (id: string) => {
    const updated = await catalogApi.test(id);
    setCatalogs(prev => prev.map(c => c.id === id ? updated : c));
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

  return { catalogs, loading, error, pingResults, fetchCatalogs, createCatalog, deleteCatalog, testCatalog, pingCatalog, pingAllCatalogs };
}
