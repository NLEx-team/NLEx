import { useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useConfirm } from '../../../shared/ui/confirm';
import { Confirm } from '../../../shared/ui/confirm';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { AddCatalogModal } from './AddCatalogModal';
import type { CatalogCreate } from '../types';
import './CatalogManager.css';

export function CatalogManager() {
  const { user } = useAuth();
  const { catalogs, loading, createCatalog, deleteCatalog, testCatalog } = useCatalogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { confirm, isOpen: isConfirmOpen, onConfirm, onCancel } = useConfirm();
  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (data: CatalogCreate) => {
    await createCatalog(data);
  };

  const handleDelete = useCallback(async (id: string) => {
    setPendingDeleteId(id);
    const ok = await confirm();
    if (ok) {
      await deleteCatalog(id);
    }
    setPendingDeleteId(null);
  }, [confirm, deleteCatalog]);

  const catalogName = pendingDeleteId
    ? catalogs.find(c => c.id === pendingDeleteId)?.name
    : '';

  return (
    <div className="catalog-manager">
      <div className="catalog-manager__header">
        <h3 className="catalog-manager__title">Catalogs</h3>
        {isAdmin && (
          <button
            className="catalog-manager__add-btn"
            onClick={() => setIsModalOpen(true)}
            title="Connect catalog"
          >
            <Icon icon="mdi:plus" />
          </button>
        )}
      </div>

      <CatalogList
        catalogs={catalogs}
        loading={loading}
        onTest={testCatalog}
        onDelete={handleDelete}
      />

      <Confirm
        isOpen={isConfirmOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Delete catalog"
        confirmText="Delete"
      >
        Are you sure you want to delete{' '}
        <strong>{catalogName || 'this catalog'}</strong>? This action cannot
        be undone.
      </Confirm>

      <AddCatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
