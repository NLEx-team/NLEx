import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { SidebarSection } from '../../app/components/SidebarSection';
import { useConfirm } from '../../../shared/ui/confirm';
import { Confirm } from '../../../shared/ui/confirm';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { AddCatalogModal } from './AddCatalogModal';
import type { CatalogCreate } from '../types';

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
    <>
      <SidebarSection
        title="Catalogs"
        className="catalog-manager"
        onAdd={isAdmin ? () => setIsModalOpen(true) : undefined}
      >
        <CatalogList
          catalogs={catalogs}
          loading={loading}
          onTest={testCatalog}
          onDelete={handleDelete}
        />
      </SidebarSection>

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
    </>
  );
}
