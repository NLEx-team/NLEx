import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../shared/ui/modal';
import { Field } from '../../../shared/ui/field';
import { Dropdown } from '../../../shared/ui/dropdown';
import { Button } from '../../../shared/ui/button';
import { useAuth } from '../../auth/hooks/useAuth';
import { catalogApi } from '../api';
import { useTranslation } from 'react-i18next';
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
  { label: 'MySQL', value: 'mysql' },
  { label: 'ClickHouse', value: 'clickhouse' },
  { label: 'Oracle', value: 'oracle' },
  { label: 'MongoDB', value: 'mongodb' },
  { label: 'MinIO (S3)', value: 'minio' },
  { label: 'SQLite', value: 'sqlite' },
];

type ModalMode = 'create' | 'view' | 'edit';

export function AddCatalogModal({ isOpen, onClose, onSubmit, initialData, onDelete }: AddCatalogModalProps) {
  const { user: authUser } = useAuth();
  const { t } = useTranslation();
  const isAdmin = authUser?.role === 'admin';
  const [mode, setMode] = useState<ModalMode>('create');
  const [name, setName] = useState('');
  const [type, setType] = useState<DatabaseType>('postgresql');
  const [url, setUrl] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; latency_ms: number | null; error: string | null } | null>(null);

  const STATUS_LABELS: Record<string, string> = {
    active: t('catalog.connected'),
    inactive: t('catalog.inactive'),
    error: t('catalog.disconnected'),
  };

  const isEdit = !!initialData;

  // Per-type placeholders and hints so each DB kind gets sensible guidance.
  const FIELD_HINTS: Record<string, { url: string; user: string; note?: string }> = {
    postgresql: { url: 'jdbc:postgresql://host:5432/db', user: 'admin' },
    mysql: { url: 'jdbc:mysql://host:3306/db', user: 'admin' },
    clickhouse: { url: 'jdbc:clickhouse://host:8123/db', user: 'default' },
    oracle: { url: 'jdbc:oracle:thin:@host:1521/db', user: 'system' },
    sqlite: { url: 'jdbc:sqlite:/path/to.db', user: '' },
    mongodb: { url: 'mongodb://host:27017/db', user: 'user (optional)', note: t('catalog.note_mongodb') },
    minio: { url: 'http://minio:9000', user: 'Access Key', note: t('catalog.note_minio') },
  };
  const hint = FIELD_HINTS[type] ?? FIELD_HINTS.postgresql;

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
    if (initialData && mode === 'view') {
      // In view mode, use ping (lightweight, available to all users)
      setLoading(true);
      setTestResult(null);
      setError(null);
      try {
        const res = await catalogApi.ping(initialData.id);
        setTestResult(res);
      } catch (err: any) {
        setTestResult({ success: false, latency_ms: null, error: err.message || 'Ping failed' });
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!url.trim()) {
      setError(t('catalog.url_required'));
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
      setError(t('catalog.name_url_required'));
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
          <h2 className="add-catalog-modal__title">{t('catalog.db_info')}</h2>
        </div>
        <div className="add-catalog-modal__form">
          <Field mode="readonly" label={t('catalog.alias')} value={name} />
          <Field mode="readonly" label={t('catalog.url')} value={url} multiline />
          <Field mode="readonly" label={t('catalog.db_type')} value={type} />
          <Field mode="readonly" label={t('catalog.db_user')} value={user} />
          {renderStatus()}
          {isAdmin && (
            <>
              {testResult && (
                <div className={`field field--${testResult.success ? 'success' : 'error'}`} style={{ color: testResult.success ? 'var(--color-accent)' : 'var(--color-error-border)', fontSize: '13px' }}>
                  {testResult.success 
                    ? t('catalog.connected_success', { ms: testResult.latency_ms })
                    : t('catalog.connection_failed', { error: testResult.error })}
                </div>
              )}
              <div className="add-catalog-modal__actions">
                <Button type="button" variant="secondary" onClick={handleCheckConnection} disabled={loading}>
                  {loading ? t('catalog.checking') : t('catalog.check_connection')}
                </Button>
                <div className="add-catalog-modal__actions-right">
                  {onDelete && (
                    <Button type="button" onClick={() => { onDelete(); handleClose(); }} disabled={loading} style={{ background: '#2B6A4C', color: 'white' }}>
                      {t('common.delete')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="add-catalog-modal">
      <div className="add-catalog-modal__header">
        <h2 className="add-catalog-modal__title">{isEdit ? t('catalog.edit_database') : t('catalog.add_database')}</h2>
      </div>
      <form className="add-catalog-modal__form" onSubmit={handleSubmit}>
        <Field
          label={t('catalog.alias')}
          placeholder="My Database"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading}
        />
        <Field
          label={t('catalog.url')}
          placeholder={hint.url}
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={loading}
          multiline
        />
        <div className="add-catalog-modal__field">
          <label className="add-catalog-modal__label">{t('catalog.db_type')}</label>
          <Dropdown
            options={DB_OPTIONS}
            value={type}
            onChange={v => setType(v as DatabaseType)}
            disabled={loading}
          />
          {hint.note && <div className="add-catalog-modal__hint">{hint.note}</div>}
        </div>
        <Field
          label={t('catalog.db_user')}
          placeholder={hint.user}
          value={user}
          onChange={e => setUser(e.target.value)}
          disabled={loading}
        />
        <Field
          label={t('catalog.db_password')}
          type="password"
          placeholder={type === 'minio' ? 'Secret Key' : t('catalog.enter_password')}
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
              ? t('catalog.connected_success', { ms: testResult.latency_ms })
              : t('catalog.connection_failed', { error: testResult.error })}
          </div>
        )}
        <div className="add-catalog-modal__actions">
          <Button type="button" variant="secondary" onClick={handleCheckConnection} disabled={loading}>
            {t('catalog.check_connection')}
          </Button>
          <div className="add-catalog-modal__actions-right">
            {isEdit ? (
              <>
                <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={loading}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading || !isDirty}>
                  {t('common.save')}
                </Button>
              </>
            ) : (
              <Button type="submit" disabled={loading}>
                {t('common.add')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
