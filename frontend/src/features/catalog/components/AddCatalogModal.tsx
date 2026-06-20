import { useState } from 'react';
import { Modal } from '../../../shared/ui/modal';
import { Field } from '../../../shared/ui/field';
import { Dropdown } from '../../../shared/ui/dropdown';
import { Button } from '../../../shared/ui/button';
import type { DatabaseType, CatalogCreate } from '../types';
import './AddCatalogModal.css';

interface AddCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CatalogCreate) => Promise<void>;
}

const DB_OPTIONS = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'ClickHouse', value: 'clickhouse' },
];

export function AddCatalogModal({ isOpen, onClose, onSubmit }: AddCatalogModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DatabaseType>('postgresql');
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setType('postgresql');
    setUrl('');
    setUser('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !url.trim()) {
      setError('Name and URL are required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), type, url: url.trim(), user, password });
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect catalog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="add-catalog-modal">
      <h2 className="add-catalog-modal__title">Connect Catalog</h2>
      <form className="add-catalog-modal__form" onSubmit={handleSubmit}>
        <Field
          label="Catalog name"
          placeholder="My Database"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
        <Field
          label="URL"
          placeholder="jdbc:postgresql://localhost:5432/mydb"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={loading}
        />
        <div className="add-catalog-modal__field">
          <label className="add-catalog-modal__label">Database type</label>
          <Dropdown
            options={DB_OPTIONS}
            value={type}
            onChange={v => setType(v as DatabaseType)}
            disabled={loading}
          />
        </div>
        <Field
          label="Database user"
          placeholder="admin"
          value={user}
          onChange={e => setUser(e.target.value)}
          disabled={loading}
        />
        <Field
          label="Database password"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
        {error && (
          <div className="field field--error">
            <span className="field__error" role="alert">{error}</span>
          </div>
        )}
        <div className="add-catalog-modal__actions">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Connecting...' : 'Connect'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
