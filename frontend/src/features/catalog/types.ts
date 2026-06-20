export type DatabaseType = 'postgresql' | 'sqlite' | 'mysql' | 'clickhouse';
export type CatalogStatus = 'active' | 'inactive' | 'error';

export interface CatalogCreate {
  name: string;
  type: DatabaseType;
  url: string;
  user: string;
  password: string;
}

export interface CatalogRead extends CatalogCreate {
  id: string;
  status: CatalogStatus;
  created_at: string;
  updated_at: string;
}
