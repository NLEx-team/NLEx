import { useState } from 'react';
import { Icon } from '@iconify/react';
import type { ChatMessageProps, OptionsBlock, TableBlock, ErrorBlock } from './ChatMessage.types';
import './ChatMessage.css';

function TextBlockView({ text }: { text: string }) {
  return <div className="chat-message__text">{text}</div>;
}

function OptionsBlockView({ block, onClarify }: { block: OptionsBlock; onClarify?: (questionId: string, selectedOptions: string[]) => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (option: string) => {
    setSelected(option);
    onClarify?.(block.questionId, [option]);
  };

  return (
    <div className="chat-message__options">
      <div className="chat-message__question">{block.question}</div>
      <div className="chat-message__options-list">
        {block.options.map(option => (
          <button
            key={option}
            className={`chat-message__option-btn ${selected === option ? 'chat-message__option-btn--selected' : ''}`}
            onClick={() => handleSelect(option)}
            disabled={selected !== null}
            type="button"
          >
            {option}
          </button>
        ))}
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
          {block.rows.length > 5 && (
            <div style={{ padding: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', textAlign: 'center', fontStyle: 'italic' }}>
              Showing 5 of {block.rows.length} rows
            </div>
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

export function ChatMessage({ role, blocks, exportUrl, onClarify, onExport }: ChatMessageProps) {
  return (
    <div className={`chat-message chat-message--${role}`}>
      <div className="chat-message__bubble">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'text':
              return <TextBlockView key={idx} text={block.text} />;
            case 'options':
              return <OptionsBlockView key={idx} block={block} onClarify={onClarify} />;
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
