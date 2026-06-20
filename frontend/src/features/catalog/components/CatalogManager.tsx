import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCatalogs } from '../hooks/useCatalogs';
import { CatalogList } from './CatalogList';
import { AddCatalogModal } from './AddCatalogModal';
import type { CatalogCreate } from '../types';
import './CatalogManager.css';

export function CatalogManager() {
  const { user } = useAuth();
  const { catalogs, loading, createCatalog, deleteCatalog, testCatalog } = useCatalogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleSubmit = async (data: CatalogCreate) => {
    await createCatalog(data);
  };

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
        onDelete={deleteCatalog}
      />

      <AddCatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
