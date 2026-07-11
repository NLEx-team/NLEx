import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useCatalogs } from '../hooks/useCatalogs';
import './DatabaseSelector.css';

interface DatabaseSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function DatabaseSelector({ selectedIds, onSelectionChange, disabled }: DatabaseSelectorProps) {
  const { t } = useTranslation();
  const { catalogs, loading } = useCatalogs();

  const selectedSet = new Set(selectedIds);

  const handleToggle = (id: string) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(Array.from(next));
  };

  if (loading) {
    return <div className="db-selector db-selector--loading">{t('catalog.loading')}</div>;
  }

  if (catalogs.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="db-selector">
      <p className="db-selector__title">{t('catalog.choose_database')}</p>
      <div className="db-selector__hint">
        <Icon icon="mdi:information-outline" />
        <span>{t('catalog.no_selection_hint')}</span>
      </div>
      <div className="db-selector__chips">
        {catalogs.map(catalog => {
          const isSelected = selectedSet.has(catalog.id);
          return (
            <button
              key={catalog.id}
              type="button"
              className={`db-selector__chip${isSelected ? ' db-selector__chip--selected' : ''}${disabled ? ' db-selector__chip--disabled' : ''}`}
              onClick={() => handleToggle(catalog.id)}
              disabled={disabled}
            >
              <span className={`db-selector__dot db-selector__dot--${catalog.status}`} />
              <span>{catalog.name}</span>
              {isSelected && <Icon icon="mdi:check" className="db-selector__check" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
