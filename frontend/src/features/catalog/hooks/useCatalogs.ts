import { useState, useEffect, useCallback } from 'react';
import { catalogApi } from '../api';
import type { CatalogRead, CatalogCreate } from '../types';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const catalog = await catalogApi.create(data);
    setCatalogs(prev => [...prev, catalog]);
  };

  const deleteCatalog = async (id: string) => {
    await catalogApi.delete(id);
    setCatalogs(prev => prev.filter(c => c.id !== id));
  };

  const testCatalog = async (id: string) => {
    const updated = await catalogApi.test(id);
    setCatalogs(prev => prev.map(c => c.id === id ? updated : c));
  };

  return { catalogs, loading, error, fetchCatalogs, createCatalog, deleteCatalog, testCatalog };
}
