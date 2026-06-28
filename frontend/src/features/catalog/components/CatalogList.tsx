import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../auth/hooks/useAuth';
import type { CatalogRead, CatalogTestResult } from '../types';
import './CatalogList.css';

interface CatalogListProps {
  catalogs: CatalogRead[];
  loading: boolean;
  pingResults: Record<string, CatalogTestResult>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPing: (id: string) => Promise<CatalogTestResult>;

  onAdd?: () => void;
  onInfo?: (catalog: CatalogRead) => void;
  disabled?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Connected',
  inactive: 'Inactive',
  error: 'Disconnected',
};

export function CatalogList({ catalogs, loading, pingResults, selectedIds, onToggleSelect, onPing, onAdd, onInfo, disabled }: CatalogListProps) {
  const [pingingId, setPingingId] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return <div className="catalog-list__empty">Loading catalogs...</div>;
  }

  const handlePing = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Don't toggle selection
    setPingingId(id);
    try {
      await onPing(id);
    } finally {
      setPingingId(null);
    }
  };

  const handleInfo = (e: React.MouseEvent, catalog: CatalogRead) => {
    e.stopPropagation(); // Don't toggle selection
    onInfo?.(catalog);
  };

  const getStatusText = (catalog: CatalogRead) => {
    if (pingingId === catalog.id) return 'Pinging...';
    const pingResult = pingResults[catalog.id];
    if (pingResult) {
      if (pingResult.success) {
        return `${pingResult.latency_ms}ms`;
      }
      return 'Disconnected';
    }
    return STATUS_LABELS[catalog.status];
  };

  const getStatusClass = (catalog: CatalogRead) => {
    const pingResult = pingResults[catalog.id];
    if (pingResult) {
      return pingResult.success ? 'active' : 'error';
    }
    return catalog.status;
  };

  return (
    <div className="catalog-list">
      {isAdmin && onAdd && (
        <button type="button" className="catalog-item catalog-item--add" onClick={onAdd}>
          <span>Add new DB</span>
          <Icon icon="mdi:plus" />
        </button>
      )}

      <div className="catalog-list__note">
        <Icon icon="mdi:information-outline" />
        <span>If no database is selected, all will be used.</span>
      </div>
      
      {catalogs.length === 0 ? (
        <div className="catalog-list__empty" style={{ paddingTop: '16px' }}>No catalogs connected</div>
      ) : (
        catalogs.map(catalog => {
          const isSelected = selectedIds.has(catalog.id);
          const isDisabled = disabled && !isSelected;
          return (
            <div
              key={catalog.id}
              className={`catalog-item${isSelected ? ' catalog-item--selected' : ''}${isDisabled ? ' catalog-item--disabled' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onToggleSelect(catalog.id);
                }
              }}
              style={{ cursor: disabled ? 'not-allowed' : 'pointer', opacity: isDisabled ? 0.5 : 1 }}
            >
              <span className={`catalog-item__status catalog-item__status--${getStatusClass(catalog)}`} />
              <div className="catalog-item__info">
                <span className="catalog-item__name">{catalog.name}</span>
                <span className="catalog-item__meta">{getStatusText(catalog)}</span>
              </div>
              {!isDisabled && (
                <div className="catalog-item__actions">
                  <button
                    type="button"
                    className={
                      "catalog-item__action-btn catalog-item__action-btn--test" + 
                      (pingingId === catalog.id ? " catalog-item__action-btn--loading" : "")
                    }
                    onClick={(e) => handlePing(e, catalog.id)}
                    title="Ping connection"
                  >
                    <Icon icon="mdi:refresh" />
                  </button>
                  <button
                    type="button"
                    className="catalog-item__action-btn"
                    onClick={(e) => handleInfo(e, catalog)}
                    title="Database info"
                  >
                    <Icon icon="mdi:information-outline" />
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
