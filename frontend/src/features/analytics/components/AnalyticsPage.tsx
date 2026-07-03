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
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Scope for admin
  const [scope, setScope] = useState<'personal' | 'global'>('personal');
  
  // State for SQL Modal
  const [selectedSql, setSelectedSql] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const url = scope === 'global' ? '/analytics/?scope=global' : '/analytics/';
      const result = await api.get<AnalyticsData>(url);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [scope]);

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

  if (loading) {
    return (
      <div className="analytics-page__loading">
        <Icon icon="mdi:loading" className="analytics-page__loading-icon" />
        <span>{t('analytics.loading')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="analytics-page__error">
        <Icon icon="mdi:alert-circle-outline" className="analytics-page__error-icon" />
        <span>{error || t('analytics.failed_load')}</span>
      </div>
    );
  }

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
                onClick={() => setScope('personal')}
              >
                {t('analytics.personal')}
              </button>
              <button 
                className={`scope-btn ${scope === 'global' ? 'active' : ''}`}
                onClick={() => setScope('global')}
              >
                {t('analytics.global')}
              </button>
            </div>
          )}
      </div>

      <div className="analytics-page__content">
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
