import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ChatMessageProps, OptionsBlock, TableBlock, ChartBlock, ErrorBlock } from './ChatMessage.types';
import { useTranslation } from 'react-i18next';
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
  return (
    <>
      <div className="chat-message__table-wrapper">
        <div className="chat-message__table-scroll">
          <table className="chat-message__table">
            <thead>
              <tr>
                {block.headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
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
        <button
          className="chat-message__export-btn"
          onClick={() => onExport?.(exportUrl, exportFilename)}
          type="button"
        >
          <Icon icon="mdi:file-download-outline" />
          <span>{t('chat.export_excel')}</span>
        </button>
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
