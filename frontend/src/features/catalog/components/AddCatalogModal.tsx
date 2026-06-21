import { useState, useEffect, useMemo } from 'react';
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

const STATUS_LABELS: Record<string, string> = {
  active: 'Connected',
  inactive: 'Inactive',
  error: 'Disconnected',
};

type ModalMode = 'create' | 'view' | 'edit';

export function AddCatalogModal({ isOpen, onClose, onSubmit, initialData, onDelete }: AddCatalogModalProps) {
  const [mode, setMode] = useState<ModalMode>('create');
  const [name, setName] = useState('');
  const [type, setType] = useState<DatabaseType>('postgresql');
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; latency_ms: number | null; error: string | null } | null>(null);

  const isEdit = !!initialData;

  const isDirty = useMemo(() => {
    if (!initialData) return true;
    return (
      name !== initialData.name ||
      type !== initialData.type ||
      url !== initialData.url ||
      user !== initialData.user ||
      password !== ''
    );
  }, [name, type, url, user, password, initialData]);

  const resetForm = () => {
    setName('');
    setType('postgresql');
    setUrl('');
    setUser('');
    setPassword('');
    setError(null);
    setTestResult(null);
  };

  const initFromData = (data: CatalogRead) => {
    setName(data.name);
    setType(data.type as DatabaseType);
    setUrl(data.url);
    setUser(data.user);
    setPassword('');
    setError(null);
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    setMode('create');
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMode('view');
        initFromData(initialData);
      } else {
        setMode('create');
        resetForm();
      }
    }
  }, [isOpen, initialData]);

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

  const handleEditStart = () => {
    initFromData(initialData!);
    setMode('edit');
  };

  const handleCancelEdit = () => {
    initFromData(initialData!);
    setMode('view');
  };

  const renderStatus = () => {
    if (!initialData) return null;
    const statusLabel = STATUS_LABELS[initialData.status] || initialData.status;
    const statusClass = `catalog-item__status--${initialData.status}`;
    return (
      <div className="add-catalog-modal__field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <span className={`catalog-item__status ${statusClass}`} style={{ display: 'inline-block' }} />
        <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{statusLabel}</span>
      </div>
    );
  };

  if (mode === 'view') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} className="add-catalog-modal">
        <div className="add-catalog-modal__header">
          <h2 className="add-catalog-modal__title">Database info</h2>
        </div>
        <div className="add-catalog-modal__form">
          <Field mode="readonly" label="Alias" value={name} />
          <Field mode="readonly" label="URL" value={url} />
          <Field mode="readonly" label="Database type" value={type} />
          <Field mode="readonly" label="Database user" value={user} />
          {renderStatus()}
          <div className="add-catalog-modal__actions">
            <Button type="button" variant="secondary" onClick={handleCheckConnection} disabled={loading}>
              Check connection
            </Button>
            <div className="add-catalog-modal__actions-right">
              {onDelete && (
                <Button type="button" onClick={() => { onDelete(); handleClose(); }} disabled={loading} style={{ background: '#2B6A4C', color: 'white' }}>
                  Delete
                </Button>
              )}
              <Button type="button" onClick={handleEditStart}>
                Edit
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="add-catalog-modal">
      <div className="add-catalog-modal__header">
        <h2 className="add-catalog-modal__title">{isEdit ? 'Edit database' : 'Add database'}</h2>
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
                <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !isDirty}>
                  Save
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
