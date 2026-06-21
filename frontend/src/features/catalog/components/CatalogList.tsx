import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../auth/hooks/useAuth';
import type { CatalogRead } from '../types';
import './CatalogList.css';

interface CatalogListProps {
  catalogs: CatalogRead[];
  loading: boolean;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  onInfo?: (catalog: CatalogRead) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Connected',
  inactive: 'Inactive',
  error: 'Error',
};

export function CatalogList({ catalogs, loading, onTest, onDelete, onAdd, onInfo }: CatalogListProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="catalog-list__empty">Loading catalogs...</div>;
  }

  if (catalogs.length === 0) {
    return <div className="catalog-list__empty">No catalogs connected</div>;
  }

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest(id);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  return (
    <div className="catalog-list">
      {onAdd && (
        <button type="button" className="catalog-item catalog-item--add" onClick={onAdd}>
          <span>Add new DB</span>
          <Icon icon="mdi:plus" />
        </button>
      )}
      {catalogs.map(catalog => (
        <div key={catalog.id} className="catalog-item">
          <span className={`catalog-item__status catalog-item__status--${catalog.status}`} />
          <div className="catalog-item__info">
            <span className="catalog-item__name">{catalog.name}</span>
            <span className="catalog-item__meta">{testingId === catalog.id ? 'Testing...' : STATUS_LABELS[catalog.status]}</span>
          </div>
          <div className="catalog-item__actions">
            <button
              type="button"
              className={
                "catalog-item__action-btn catalog-item__action-btn--test" + 
                (testingId === catalog.id ? " catalog-item__action-btn--loading" : "")
              }
              onClick={() => handleTest(catalog.id)}
              title="Test connection"
            >
              <Icon icon="mdi:refresh" />
            </button>
            <button
              type="button"
              className="catalog-item__action-btn"
              onClick={() => onInfo?.(catalog)}
              title="Database info"
            >
              <Icon icon="mdi:information-outline" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
