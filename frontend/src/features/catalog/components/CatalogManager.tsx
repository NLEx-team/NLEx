import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { SidebarSection } from '../../app/components/SidebarSection';
import { useConfirm } from '../../../shared/ui/confirm';
import { Confirm } from '../../../shared/ui/confirm';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { AddCatalogModal } from './AddCatalogModal';
import { catalogApi } from '../api';
import { useTranslation } from 'react-i18next';
import type { CatalogRead, CatalogCreate } from '../types';

interface CatalogManagerProps {
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function CatalogManager({ selectedIds, onSelectionChange, disabled }: CatalogManagerProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { catalogs, loading, pingResults, syncStatuses, createCatalog, deleteCatalog, pingCatalog } = useCatalogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogRead | null>(null);
  const { confirm, isOpen: isConfirmOpen, onConfirm, onCancel } = useConfirm();
  const isAdmin = user?.role === 'admin';

  const selectedIdsSet = new Set(selectedIds);

  const handleToggleSelect = useCallback((id: string) => {
    const next = new Set(selectedIdsSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(Array.from(next));
  }, [selectedIdsSet, onSelectionChange]);

  const handleSubmit = async (data: CatalogCreate) => {
    await createCatalog(data);
  };

  const handleDelete = useCallback(async (id: string) => {
    const ok = await confirm();
    if (ok) {
      await deleteCatalog(id);
      // Remove from selection if deleted
      if (selectedIdsSet.has(id)) {
        const next = new Set(selectedIdsSet);
        next.delete(id);
        onSelectionChange(Array.from(next));
      }
    }
  }, [confirm, deleteCatalog, selectedIdsSet, onSelectionChange]);

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

  return (
    <>
      <SidebarSection
        title={t('catalog.database_list')}
        className="catalog-manager"
      >
        <CatalogList
          catalogs={catalogs}
          loading={loading}
          pingResults={pingResults}
          syncStatuses={syncStatuses}
          selectedIds={selectedIdsSet}
          onToggleSelect={handleToggleSelect}
          onPing={pingCatalog}

          onAdd={() => { setSelectedCatalog(null); setIsModalOpen(true); }}
          onInfo={handleInfo}
          disabled={disabled}
        />
      </SidebarSection>

      <Confirm
        isOpen={isConfirmOpen}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title={t('catalog.delete_catalog')}
        confirmText={t('common.delete')}
      >
        {t('catalog.delete_confirm_generic')}
      </Confirm>

      <AddCatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedCatalog || undefined}
        onDelete={isAdmin && selectedCatalog ? () => handleDelete(selectedCatalog.id) : undefined}
      />
    </>
  );
}
