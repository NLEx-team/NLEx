import { api } from '../../utils/api';
import type { CatalogRead, CatalogCreate } from './types';

export const catalogApi = {
  list: () => api.get<CatalogRead[]>('/catalogs'),
  create: (data: CatalogCreate) => api.post<CatalogRead>('/catalogs', data),
  delete: (id: string) => api.delete(`/catalogs/${id}`),
  test: (id: string) => api.post<CatalogRead>(`/catalogs/${id}/test`),
};
