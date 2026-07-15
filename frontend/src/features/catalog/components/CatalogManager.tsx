import { useCallback } from 'react';
import { SidebarSection } from '../../app/components/SidebarSection';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { useTranslation } from 'react-i18next';

interface CatalogManagerProps {
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function CatalogManager({ selectedIds, onSelectionChange, disabled }: CatalogManagerProps) {
  const { t } = useTranslation();
  const { catalogs, loading, pingResults, syncStatuses, pingCatalog } = useCatalogs();

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

  return (
    <SidebarSection title={t('catalog.database_list')} className="catalog-manager">
      <CatalogList
        catalogs={catalogs}
        loading={loading}
        pingResults={pingResults}
        syncStatuses={syncStatuses}
        selectedIds={selectedIdsSet}
        onToggleSelect={handleToggleSelect}
        onPing={pingCatalog}
        disabled={disabled}
      />
    </SidebarSection>
  );
}
