import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../auth/hooks/useAuth';
import { Icon } from '@iconify/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './AnalyticsPage.css';
import { Modal } from '../../../shared/ui/modal';
import { MultiSelectDropdown } from '../../../shared/ui/multi-select-dropdown/MultiSelectDropdown';
import { DateRangePicker } from './DateRangePicker';
import { api } from '../../../utils/api';
import { config } from '../../../utils/config';

interface AnalyticsData {
  total_chats: number;
  total_requests: number;
  total_tokens: number;
  usage_history: {
    date: string;
    requests: number;
    tokens: number;
  }[];
  history_list: {
    id: string;
    chat_id: string;
    date: string;
    query: string;
    sql: string | null;
    export_url: string | null;
    user_email?: string | null;
    database: string;
  }[];
  available_users: { id: string; email: string }[];
  available_catalogs: { id: string; name: string }[];
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scope for admin
  const [scope, setScope] = useState<'personal' | 'global'>('personal');

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterCatalogIds, setFilterCatalogIds] = useState<string[]>([]);
  const [matchMode, setMatchMode] = useState<'any' | 'exact'>('any');
  const [search, setSearch] = useState('');

  // Filter option lists (persisted across refetches so dropdowns don't flicker)
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string }[]>([]);
  const [availableCatalogs, setAvailableCatalogs] = useState<{ id: string; name: string }[]>([]);

  // State for SQL Modal
  const [selectedSql, setSelectedSql] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (scope === 'global') params.set('scope', 'global');
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (scope === 'global' && filterUserId) params.set('user_id', filterUserId);
      if (filterCatalogIds.length) {
        params.set('catalog_ids', filterCatalogIds.join(','));
        params.set('match_mode', matchMode);
      }
      if (search.trim()) params.set('search', search.trim());
      const qs = params.toString();
      const result = await api.get<AnalyticsData>(`/analytics/${qs ? `?${qs}` : ''}`);
      setData(result);
      setAvailableUsers(result.available_users || []);
      setAvailableCatalogs(result.available_catalogs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounced refetch whenever a filter changes.
  useEffect(() => {
    const timer = setTimeout(() => { fetchAnalytics(); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, startDate, endDate, filterUserId, filterCatalogIds, matchMode, search]);

  const handleScopeChange = (s: 'personal' | 'global') => {
    setScope(s);
    if (s === 'personal') setFilterUserId('');
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterUserId('');
    setFilterCatalogIds([]);
    setMatchMode('any');
    setSearch('');
  };

  const hasActiveFilters = !!(startDate || endDate || filterUserId || filterCatalogIds.length || search.trim());

  const handleCopySql = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = async (exportUrl: string, id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(`${config.apiUrl}${exportUrl}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${id.substring(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert(t('common.failed_download'));
    } finally {
      setDownloadingId(null);
    }
  };

  // First load
  if (loading && !data) {
    return (
      <div className="analytics-page__loading">
        <Icon icon="mdi:loading" className="analytics-page__loading-icon" />
        <span>{t('analytics.loading')}</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="analytics-page__error">
        <Icon icon="mdi:alert-circle-outline" className="analytics-page__error-icon" />
        <span>{error || t('analytics.failed_load')}</span>
      </div>
    );
  }

  if (!data) return null;

  // Format dates for chart
  const chartData = [...data.usage_history].map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="analytics-page">
      <div className="analytics-page__header">
        {user?.role === 'admin' && (
          <div className="analytics-scope-toggle">
            <button
              className={`scope-btn ${scope === 'personal' ? 'active' : ''}`}
              onClick={() => handleScopeChange('personal')}
            >
              {t('analytics.personal')}
            </button>
            <button
              className={`scope-btn ${scope === 'global' ? 'active' : ''}`}
              onClick={() => handleScopeChange('global')}
            >
              {t('analytics.global')}
            </button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="analytics-filters">
        <div className="analytics-filter">
          <label>{t('analytics.period')}</label>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          />
        </div>
        {scope === 'global' && (
          <div className="analytics-filter">
            <label>{t('analytics.filter_user')}</label>
            <select value={filterUserId} onChange={e => setFilterUserId(e.target.value)}>
              <option value="">{t('analytics.filter_all_users')}</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>
        )}
        <div className="analytics-filter">
          <label>{t('analytics.filter_database')}</label>
          <MultiSelectDropdown
            className="analytics-catalog-select"
            options={availableCatalogs.map(c => ({ label: c.name, value: c.id }))}
            value={filterCatalogIds}
            onChange={setFilterCatalogIds}
            placeholder={t('analytics.filter_all_databases')}
            selectAllLabel={t('analytics.combo_all_dbs')}
            searchable={availableCatalogs.length > 7}
            searchPlaceholder={t('analytics.filter_search_db')}
            footer={
              <div className="analytics-match-mode">
                <label className="analytics-match-mode__opt">
                  <input
                    type="radio"
                    name="analytics-match"
                    checked={matchMode === 'any'}
                    onChange={() => setMatchMode('any')}
                  />
                  <span>{t('analytics.match_any')}</span>
                  <span className="analytics-hint" title={t('analytics.match_any_hint')}>?</span>
                </label>
                <label className="analytics-match-mode__opt">
                  <input
                    type="radio"
                    name="analytics-match"
                    checked={matchMode === 'exact'}
                    onChange={() => setMatchMode('exact')}
                  />
                  <span>{t('analytics.match_exact')}</span>
                  <span className="analytics-hint" title={t('analytics.match_exact_hint')}>?</span>
                </label>
              </div>
            }
          />
        </div>
        <div className="analytics-filter analytics-filter--search">
          <label>{t('analytics.filter_search')}</label>
          <div className="analytics-search">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('analytics.filter_search_ph')}
            />
            {search && (
              <button
                type="button"
                className="analytics-search__clear"
                onClick={() => setSearch('')}
                aria-label={t('analytics.filter_search_clear')}
              >
                <Icon icon="mdi:close" />
              </button>
            )}
          </div>
        </div>
        {hasActiveFilters && (
          <button className="analytics-filters__reset" onClick={resetFilters} title={t('analytics.filter_reset')}>
            <Icon icon="mdi:filter-remove-outline" />
            <span>{t('analytics.filter_reset')}</span>
          </button>
        )}
      </div>

      <div className={`analytics-page__content ${loading ? 'analytics-page__content--loading' : ''}`}>
        <div className="analytics-page__cards">
          <div className="analytics-card">
            <div className="analytics-card__icon-wrapper">
              <Icon icon="mdi:message-text-outline" className="analytics-card__icon" />
            </div>
            <div className="analytics-card__info">
              <div className="analytics-card__value">{data.total_requests}</div>
              <div className="analytics-card__label">{t('analytics.total_requests')}</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card__icon-wrapper">
              <Icon icon="mdi:database-outline" className="analytics-card__icon" />
            </div>
            <div className="analytics-card__info">
              <div className="analytics-card__value">{data.total_tokens.toLocaleString()}</div>
              <div className="analytics-card__label">{t('analytics.tokens_used')}</div>
            </div>
          </div>
          <div className="analytics-card">
            <div className="analytics-card__icon-wrapper">
              <Icon icon="mdi:chat-outline" className="analytics-card__icon" />
            </div>
            <div className="analytics-card__info">
              <div className="analytics-card__value">{data.total_chats}</div>
              <div className="analytics-card__label">{t('analytics.chats_created')}</div>
            </div>
          </div>
        </div>

        <div className="analytics-page__chart-section">
          <h2 className="analytics-page__section-title">{t('analytics.usage_over_time')}</h2>
          <div className="analytics-page__chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fill: '#7f8892', fontSize: 12 }} dy={10} />
                <YAxis yAxisId="left" orientation="left" stroke="#8A92A6" axisLine={false} tickLine={false} tick={{ fill: '#7f8892', fontSize: 12 }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" stroke="#8A92A6" axisLine={false} tickLine={false} tick={{ fill: '#7f8892', fontSize: 12 }} dx={10} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(33, 115, 70, 0.05)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar yAxisId="left" name={t('analytics.requests')} dataKey="requests" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="right" name={t('analytics.tokens')} dataKey="tokens" fill="#ffb74d" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-page__history-section">
          <h2 className="analytics-page__section-title">{t('analytics.query_history')}</h2>
          {data.history_list.length === 0 ? (
            <div className="analytics-page__empty-history">{t('analytics.no_history')}</div>
          ) : (
            <div className="analytics-page__table-wrapper">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>{t('analytics.date')}</th>
                    {scope === 'global' && <th>{t('analytics.account')}</th>}
                    <th>{t('analytics.database')}</th>
                    <th>{t('analytics.user_query')}</th>
                    <th>{t('analytics.generated_sql')}</th>
                    <th className="analytics-table__action-header">{t('analytics.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history_list.map((item) => (
                    <tr key={item.id}>
                      <td className="analytics-table__date">
                        {new Date(item.date).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {scope === 'global' && (
                        <td className="analytics-table__account" style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                          {item.user_email || t('common.unknown')}
                        </td>
                      )}
                      <td className="analytics-table__database" style={{ color: 'var(--color-primary-dark)', fontSize: '13px', fontWeight: 500 }}>
                        {item.database}
                      </td>
                      <td className="analytics-table__query">{item.query}</td>
                      <td className="analytics-table__sql">
                        {item.sql ? (
                          <div className="analytics-table__sql-actions">
                            <code>{item.sql.substring(0, 30)}{item.sql.length > 30 ? '...' : ''}</code>
                            <button
                              className="analytics-table__view-btn"
                              onClick={() => setSelectedSql(item.sql)}
                            >
                              <Icon icon="mdi:eye-outline" /> {t('analytics.view')}
                            </button>
                          </div>
                        ) : (
                          <span className="analytics-table__no-sql">-</span>
                        )}
                      </td>
                      <td className="analytics-table__action">
                        {item.export_url && (
                          <button
                            className="analytics-table__download-btn"
                            onClick={() => handleDownload(item.export_url!, item.id)}
                            disabled={downloadingId === item.id}
                          >
                            <Icon icon={downloadingId === item.id ? "mdi:loading" : "mdi:file-excel-outline"} className={downloadingId === item.id ? "spin" : ""} />
                            {downloadingId === item.id ? t('analytics.downloading') : t('analytics.download_file')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedSql} onClose={() => { setSelectedSql(null); setCopied(false); }} className="sql-modal">
        <div className="sql-modal__header">
          <h3>{t('analytics.generated_sql')}</h3>
          <div className="sql-modal__actions">
            <button className="sql-modal__copy-btn" onClick={() => handleCopySql(selectedSql!)}>
              <Icon icon={copied ? "mdi:check" : "mdi:content-copy"} />
              {copied ? t('analytics.copied') : t('analytics.copy_sql')}
            </button>
            <button className="sql-modal__close-btn" onClick={() => { setSelectedSql(null); setCopied(false); }}>
              <Icon icon="mdi:close" />
            </button>
          </div>
        </div>
        <div className="sql-modal__content">
          <pre>
            <code>{selectedSql}</code>
          </pre>
        </div>
      </Modal>
    </div>
  );
}
