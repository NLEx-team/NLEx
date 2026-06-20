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
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Connected',
  inactive: 'Inactive',
  error: 'Error',
};

export function CatalogList({ catalogs, loading, onTest, onDelete }: CatalogListProps) {
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="catalog-list__empty">Loading catalogs...</div>;
  }

  if (catalogs.length === 0) {
    return <div className="catalog-list__empty">No catalogs connected</div>;
  }

  const handleTest = async (id: string) => {
    setIsTesting(true);
    await onTest(id);
    setIsTesting(false);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
  };

  return (
    <div className="catalog-list">
      {catalogs.map(catalog => (
        <div key={catalog.id} className="catalog-item">
          <span className={`catalog-item__status catalog-item__status--${catalog.status}`} />
          <div className="catalog-item__info">
            <div className="catalog-item__name">{catalog.name}</div>
            <div className="catalog-item__meta">{
              isTesting ? 'Testing...' : STATUS_LABELS[catalog.status]
            }</div>
          </div>
          {isAdmin && (
            <div className="catalog-item__actions">
              <button
                className={
                  "catalog-item__action-btn catalog-item__action-btn--test" + 
                  (isTesting ? " catalog-item__action-btn--loading" : "")
                }
                onClick={() => handleTest(catalog.id)}
                title="Test connection"
              >
                <Icon icon="mdi:refresh" />
              </button>
              <button
                className="catalog-item__action-btn catalog-item__action-btn--delete"
                onClick={() => handleDelete(catalog.id)}
                title="Remove catalog"
              >
                <Icon icon="mdi:delete-outline" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
