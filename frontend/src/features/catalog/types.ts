export type DatabaseType = 'postgresql' | 'sqlite' | 'mysql' | 'clickhouse';
export type CatalogStatus = 'active' | 'inactive' | 'error';

export interface CatalogCreate {
  name: string;
  type: DatabaseType;
  url: string;
  user: string;
  password: string;
}

export interface CatalogRead {
  id: string;
  name: string;
  type: DatabaseType;
  url: string;
  user: string;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}

export interface CatalogTestResult {
  success: boolean;
  latency_ms: number | null;
  error: string | null;
}
