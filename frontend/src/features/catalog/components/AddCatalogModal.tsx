import { useState, useEffect } from 'react';
import { Modal } from '../../../shared/ui/modal';
import { Field } from '../../../shared/ui/field';
import { Dropdown } from '../../../shared/ui/dropdown';
import { Button } from '../../../shared/ui/button';
import { catalogApi } from '../api';
import type { DatabaseType, CatalogCreate, CatalogRead } from '../types';
import './AddCatalogModal.css';

interface AddCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CatalogCreate) => Promise<void>;
  initialData?: CatalogRead;
  onDelete?: () => void;
}

const DB_OPTIONS = [
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'SQLite', value: 'sqlite' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'ClickHouse', value: 'clickhouse' },
];

export function AddCatalogModal({ isOpen, onClose, onSubmit, initialData, onDelete }: AddCatalogModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DatabaseType>('postgresql');
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; latency_ms: number | null; error: string | null } | null>(null);

  const resetForm = () => {
    setName('');
    setType('postgresql');
    setUrl('');
    setUser('');
    setPassword('');
    setError(null);
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Use React.useEffect correctly
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type as DatabaseType);
        setUrl('');
        setUser('');
        setPassword('');
        setError(null);
        setTestResult(null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const isEdit = !!initialData;

  const handleCheckConnection = async () => {
    if (!url.trim()) {
      setError('URL is required to test connection');
      return;
    }
    setLoading(true);
    setTestResult(null);
    setError(null);
    try {
      const data: CatalogCreate = { name: name.trim() || 'test_db', type, url: url.trim(), user, password };
      const res = await catalogApi.testNew(data);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, latency_ms: null, error: err.message || 'Connection failed' });
    } finally {
      setLoading(false);
    }
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
      <div className="add-catalog-modal__header">
        <h2 className="add-catalog-modal__title">{isEdit ? 'Database info' : 'Add database'}</h2>
      </div>
      <form className="add-catalog-modal__form" onSubmit={handleSubmit}>
        <Field
          label="Alias"
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
        {testResult && (
          <div className={`field field--${testResult.success ? 'success' : 'error'}`} style={{ color: testResult.success ? 'var(--color-accent)' : 'var(--color-error-border)', fontSize: '13px' }}>
            {testResult.success 
              ? `Connected successfully! Latency: ${testResult.latency_ms}ms`
              : `Connection failed: ${testResult.error}`}
          </div>
        )}
        <div className="add-catalog-modal__actions">
          <Button type="button" variant="secondary" onClick={handleCheckConnection} disabled={loading}>
            Check connection
          </Button>
          <div className="add-catalog-modal__actions-right">
            {isEdit ? (
              <>
                {onDelete && (
                  <Button type="button" onClick={() => { onDelete(); handleClose(); }} disabled={loading} style={{ background: '#2B6A4C', color: 'white' }}>
                    Delete
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  Edit
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={loading}>
                Add
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
