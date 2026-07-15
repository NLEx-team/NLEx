import { api } from '../../utils/api';
import type { CatalogRead, CatalogCreate, CatalogTestResult, CatalogSyncStatus } from './types';

export const catalogApi = {
  list: () => api.get<CatalogRead[]>('/catalogs'),
  create: (data: CatalogCreate) => api.post<CatalogRead>('/catalogs', data),
  delete: (id: string) => api.delete(`/catalogs/${id}`),
  test: (id: string) => api.post<CatalogRead>(`/catalogs/${id}/test`),
  ping: (id: string) => api.post<CatalogTestResult>(`/catalogs/${id}/ping`),
  testNew: (data: CatalogCreate) => api.post<CatalogTestResult>('/catalogs/test-connection', data),
  syncStatus: (id: string) => api.get<CatalogSyncStatus>(`/catalogs/${id}/sync-status`),
};

