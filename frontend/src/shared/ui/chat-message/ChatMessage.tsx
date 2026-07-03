import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ChatMessageProps, OptionsBlock, TableBlock, ErrorBlock } from './ChatMessage.types';
import { useTranslation } from 'react-i18next';
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

function TableBlockView({ block, exportUrl, onExport }: { block: TableBlock; exportUrl?: string; onExport?: (exportUrl: string) => void }) {
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
                    <td key={ci}>{cell == null ? 'NULL' : String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.totalRows !== undefined ? (
            block.totalRows > block.rows.length && (
              <div style={{ padding: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                Showing {block.rows.length} of {block.totalRows} rows
              </div>
            )
          ) : (
            block.rows.length > 5 && (
              <div style={{ padding: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
                Showing 5 of {block.rows.length} rows
              </div>
            )
          )}
        </div>
        <div className="chat-message__table-actions">
          {block.sql && (
            <details className="chat-message__sql-details">
              <summary className="chat-message__sql-summary">
                <Icon icon="mdi:code-tags" />
                <span>View SQL</span>
              </summary>
              <pre className="chat-message__sql">{block.sql}</pre>
            </details>
          )}
        </div>
      </div>
      {exportUrl && (
        <button
          className="chat-message__export-btn"
          onClick={() => onExport?.(exportUrl)}
          type="button"
        >
          <Icon icon="mdi:file-download-outline" />
          <span>Export to Excel</span>
        </button>
      )}
    </>
  );
}

function ErrorBlockView({ block }: { block: ErrorBlock }) {
  return (
    <div className="chat-message__error">
      <Icon icon="mdi:alert-circle-outline" />
      <span>{block.message}</span>
      {block.sql && (
        <details className="chat-message__sql-details">
          <summary className="chat-message__sql-summary">
            <Icon icon="mdi:code-tags" />
            <span>SQL attempted</span>
          </summary>
          <pre className="chat-message__sql">{block.sql}</pre>
        </details>
      )}
    </div>
  );
}

export function ChatMessage({ role, blocks, exportUrl, onClarify, onExport, isLastMessage }: ChatMessageProps) {
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
              return <TableBlockView key={idx} block={block} exportUrl={exportUrl} onExport={onExport} />;
            case 'error':
              return <ErrorBlockView key={idx} block={block} />;
          }
        })}
      </div>
    </div>
  );
}
