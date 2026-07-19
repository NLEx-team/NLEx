import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { ChatMessageProps, OptionsBlock, TableBlock, ChartBlock, ErrorBlock } from './ChatMessage.types';
import { useTranslation } from 'react-i18next';
import { config } from '../../../utils/config';
import {
  ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts';
import './ChatMessage.css';

function TextBlockView({ text }: { text: string }) {
  return <div className="chat-message__text">{text}</div>;
}

function OptionsBlockView({ block, onClarify, isLastMessage }: { block: OptionsBlock; onClarify?: (questionId: string, selectedOptions: string[]) => void; isLastMessage?: boolean }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleSelect = (option: string) => {
    setSelected(option);
    onClarify?.(block.questionId, [option]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customValue.trim()) return;
    setSelected('custom');
    onClarify?.(block.questionId, [customValue.trim()]);
  };

  const isActive = selected === null && isLastMessage;

  return (
    <div className="chat-message__options">
      <div className="chat-message__question">{block.question}</div>
      <div className="chat-message__options-list">
        {block.options.map(option => (
          <button
            key={option}
            className={`chat-message__option-btn ${selected === option ? 'chat-message__option-btn--selected' : ''}`}
            onClick={() => handleSelect(option)}
            disabled={!isActive}
            type="button"
          >
            {option}
          </button>
        ))}
        {!showCustom && isActive && (
          <button
            className="chat-message__option-btn chat-message__option-btn--outline"
            onClick={() => setShowCustom(true)}
            type="button"
          >
            {t('chat.other_option', { defaultValue: 'Другое (написать своё)' })}
          </button>
        )}
        {showCustom && isActive && (
          <form onSubmit={handleCustomSubmit} className="chat-message__custom-form">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder={t('chat.enter_reply', { defaultValue: 'Введите ваш ответ...' })}
              className="chat-message__custom-input"
              autoFocus
            />
            <button type="submit" className="chat-message__custom-submit" disabled={!customValue.trim()}>
              <Icon icon="mdi:send-outline" width="20" height="20" />
            </button>
          </form>
        )}
        {selected === 'custom' && (
          <div className="chat-message__option-btn chat-message__option-btn--selected">
            {customValue}
          </div>
        )}
      </div>
    </div>
  );
}

function TableBlockView({ block, exportUrl, exportFilename, onExport }: { block: TableBlock; exportUrl?: string; exportFilename?: string; onExport?: (exportUrl: string, filename?: string) => void }) {
  const { t } = useTranslation();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done' | 'fading'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleExportClick = () => {
    if (downloadState === 'downloading' || downloadState === 'fading' || !exportUrl) return;

    setDownloadState('downloading');
    setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    // Wrap the parent onExport in a promise-like flow
    const cleanup = (success: boolean) => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setElapsed(Math.floor((Date.now() - start) / 1000));
      if (success) {
        setDownloadState('done');
        setTimeout(() => {
          setDownloadState('fading');
          setTimeout(() => setDownloadState('idle'), 500);
        }, 3500);
      } else {
        setDownloadState('idle');
      }
    };

    // We call onExport but also track the result ourselves
    if (onExport) {
      // Fire and track via a direct fetch so we can show progress
      fetch(`${config.apiUrl}${exportUrl}`, { credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) throw new Error('Export download failed');
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = exportFilename || (response.headers.get('Content-Disposition')?.match(/filename="?([^";\n]+)"?/)?.[1] || 'export.xlsx');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          cleanup(true);
        })
        .catch((err) => {
          console.error('Export download failed:', err);
          cleanup(false);
        });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}с`;
    return `${Math.floor(s / 60)}м ${s % 60}с`;
  };

  return (
    <>
      <div className="chat-message__table-wrapper">
        <div className="chat-message__table-scroll">
          <table className="chat-message__table">
            <thead>
              <tr>
                {block.headers.map((header, ci) => {
                  const firstRow = block.rows[0];
                  const isNumber = firstRow && typeof firstRow[ci] === 'number';
                  return <th key={header} data-type={isNumber ? 'number' : 'text'}>{header}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(0, 5).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell: any, ci: number) => (
                    <td key={ci} data-type={typeof cell === 'number' ? 'number' : 'text'}>
                      {cell == null ? 'NULL' : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.totalRows !== undefined ? (
            block.totalRows > block.rows.length && (
              <div style={{ padding: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                {t('chat.showing_rows', { shown: block.rows.length, total: block.totalRows })}
              </div>
            )
          ) : (
            block.rows.length > 5 && (
              <div style={{ padding: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                {t('chat.showing_rows', { shown: 5, total: block.rows.length })}
              </div>
            )
          )}
        </div>
        <div className="chat-message__table-actions">
          {block.sql && (
            <details className="chat-message__sql-details">
              <summary className="chat-message__sql-summary">
                <Icon icon="mdi:code-tags" />
                <span>{t('chat.view_sql')}</span>
              </summary>
              <pre className="chat-message__sql">{block.sql}</pre>
            </details>
          )}
        </div>
      </div>
      {exportUrl && (
        <div className="chat-message__export-row">
          <button
            className={`chat-message__export-btn ${downloadState === 'downloading' ? 'chat-message__export-btn--loading' : ''} ${downloadState === 'done' ? 'chat-message__export-btn--done' : ''} ${downloadState === 'fading' ? 'chat-message__export-btn--fading' : ''}`}
            onClick={handleExportClick}
            type="button"
            disabled={downloadState === 'downloading' || downloadState === 'fading'}
          >
            {(downloadState === 'idle' || downloadState === 'fading') && (
              <>
                <Icon icon="mdi:file-download-outline" />
                <span>{t('chat.export_excel')}</span>
              </>
            )}
            {downloadState === 'downloading' && (
              <>
                <span className="chat-message__export-spinner" />
                <span>{t('common.downloading', { defaultValue: 'Скачивание...' })}</span>
              </>
            )}
            {downloadState === 'done' && (
              <>
                <Icon icon="mdi:check-circle-outline" />
                <span>{t('common.download_file', { defaultValue: 'Готово!' })}</span>
              </>
            )}
          </button>

          {downloadState === 'downloading' && (
            <div className="chat-message__download-info">
              <div className="chat-message__download-progress-bar">
                <div className="chat-message__download-progress-fill" />
              </div>
              <div className="chat-message__download-details">
                <span className="chat-message__download-detail">
                  <Icon icon="mdi:clock-outline" width={14} height={14} />
                  {formatTime(elapsed)}
                </span>
                {block.totalRows !== undefined && (
                  <span className="chat-message__download-detail">
                    <Icon icon="mdi:table-large" width={14} height={14} />
                    {block.totalRows.toLocaleString()} {t('chat.rows_label', { defaultValue: 'строк' })}
                  </span>
                )}
                <span className="chat-message__download-detail">
                  <Icon icon="mdi:file-excel-outline" width={14} height={14} />
                  .xlsx
                </span>
              </div>
            </div>
          )}

          {downloadState === 'done' && (
            <div className="chat-message__download-info chat-message__download-info--done">
              <span className="chat-message__download-detail">
                <Icon icon="mdi:check-bold" width={14} height={14} />
                {t('chat.downloaded_in', { defaultValue: `Скачано за ${formatTime(elapsed)}`, time: formatTime(elapsed) })}
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const CHART_COLORS = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47', '#264478', '#9B57A0'];

function ChartBlockView({ block }: { block: ChartBlock }) {
  if (!block.data || !block.headers || block.data.length === 0) return null;

  const chartData = block.data.map(row => {
    const obj: Record<string, any> = {};
    block.headers!.forEach((h, i) => {
      const val = row[i];
      obj[h] = typeof val === 'string' && !isNaN(Number(val)) ? Number(val) : val;
    });
    return obj;
  });

  const yKeys = block.yColumns ?? [];
  const xKey = block.xColumn ?? block.headers[0];
  const title = block.title;

  const renderTitle = title
    ? <div className="chat-message__chart-title">{title}</div>
    : null;

  if (block.chartType === 'pie') {
    const catKey = block.categoryColumn ?? block.headers[0];
    const valKey = block.valueColumn ?? (block.headers[1] ?? block.headers[0]);
    return (
      <div className="chat-message__chart-wrapper">
        {renderTitle}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey={valKey}
              nameKey={catKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (block.chartType === 'scatter') {
    return (
      <div className="chat-message__chart-wrapper">
        {renderTitle}
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} name={xKey} />
            <YAxis dataKey={yKeys[0]} name={yKeys[0]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter data={chartData} fill="#4472C4" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const isBar = block.chartType === 'bar';
  const isArea = block.chartType === 'area';
  const ChartComponent = isBar ? BarChart : isArea ? AreaChart : LineChart;
  const DataComponent = isBar ? Bar : isArea ? Area : Line;

  return (
    <div className="chat-message__chart-wrapper">
      {renderTitle}
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {yKeys.map((key, idx) => (
            <DataComponent
              key={key}
              type="monotone"
              dataKey={key}
              fill={CHART_COLORS[idx % CHART_COLORS.length]}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              fillOpacity={isArea ? 0.3 : undefined}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

function ErrorBlockView({ block }: { block: ErrorBlock }) {
  const { t } = useTranslation();
  return (
    <div className="chat-message__error">
      <Icon icon="mdi:alert-circle-outline" />
      <span>{block.message}</span>
      {block.sql && (
        <details className="chat-message__sql-details">
          <summary className="chat-message__sql-summary">
            <Icon icon="mdi:code-tags" />
            <span>{t('chat.sql_attempted')}</span>
          </summary>
          <pre className="chat-message__sql">{block.sql}</pre>
        </details>
      )}
    </div>
  );
}

export function ChatMessage({ role, blocks, exportUrl, exportFilename, onClarify, onExport, isLastMessage }: ChatMessageProps) {
  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__bubble">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'text':
              return <TextBlockView key={idx} text={block.text} />;
            case 'options':
              return <OptionsBlockView key={idx} block={block} onClarify={onClarify} isLastMessage={isLastMessage} />;
            case 'table':
              return <TableBlockView key={idx} block={block} exportUrl={exportUrl} exportFilename={exportFilename} onExport={onExport} />;
            case 'chart':
              return <ChartBlockView key={idx} block={block} />;
            case 'error':
              return <ErrorBlockView key={idx} block={block} />;
          }
        })}
      </div>
    </div>
  );
}
