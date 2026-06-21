import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { SidebarSection } from '../../app/components/SidebarSection';
import { useConfirm } from '../../../shared/ui/confirm';
import { Confirm } from '../../../shared/ui/confirm';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { AddCatalogModal } from './AddCatalogModal';
import { catalogApi } from '../api';
import type { CatalogRead, CatalogCreate } from '../types';

export function CatalogManager() {
  const { user } = useAuth();
  const { catalogs, loading, createCatalog, deleteCatalog, testCatalog } = useCatalogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogRead | null>(null);
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

  const handleInfo = useCallback(async (cat: CatalogRead) => {
    try {
      const freshList = await catalogApi.list();
      const fresh = freshList.find(c => c.id === cat.id) || cat;
      setSelectedCatalog(fresh);
    } catch {
      setSelectedCatalog(cat);
    }
    setIsModalOpen(true);
  }, []);

  const catalogName = pendingDeleteId
    ? catalogs.find(c => c.id === pendingDeleteId)?.name
    : '';

  return (
    <>
      <SidebarSection
        title="Database list"
        className="catalog-manager"
      >
        <CatalogList
          catalogs={catalogs}
          loading={loading}
          onTest={testCatalog}
          onDelete={handleDelete}
          onAdd={() => { setSelectedCatalog(null); setIsModalOpen(true); }}
          onInfo={handleInfo}
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
        initialData={selectedCatalog || undefined}
        onDelete={selectedCatalog ? () => handleDelete(selectedCatalog.id) : undefined}
      />
    </>
  );
}
