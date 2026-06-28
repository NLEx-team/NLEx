import { useCallback, useEffect, useRef } from 'react';

import { ChatInput } from '../../../shared/ui/chat-input';
import { ChatMessage } from '../../../shared/ui/chat-message';
import { Logo } from '../../../shared/ui/logo';
import { chatApi } from '../api';
import type { ChatMessage as ChatMessageType } from '../types';
import './Chat.css';

interface ChatProps {
  messages: ChatMessageType[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  handleClarification: (questionId: string, selectedOptions: string[]) => void;
  pending: boolean;
  pendingStatus?: string;
}

const STATUS_MESSAGES: Record<string, { text: string }> = {
  unknown: { text: 'Starting...' },
  IDLE: { text: 'Starting...' },
  CATALOG_CONNECTING: { text: 'Connecting to database...' },
  RELATIONSHIP_INFERRING: { text: 'Analyzing schema...' },
  GENERATING_SQL: { text: 'Writing SQL query...' },
  EXECUTING_SQL: { text: 'Executing query...' },
  FIXING_SQL: { text: 'Fixing SQL error...' },
  COMPLETED: { text: 'Formatting results...' },
  FAILED: { text: 'Failed.' },
};

export function Chat({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleClarification,
  pending,
  pendingStatus,
}: ChatProps) {
  const handleExport = useCallback((exportUrl: string) => {
    chatApi.downloadExport(exportUrl).catch((err) => {
      console.error('Export download failed:', err);
      alert('Failed to download export. Please try again.');
    });
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingStatus]);

  const currentStatusInfo = pendingStatus 
    ? STATUS_MESSAGES[pendingStatus] || STATUS_MESSAGES.unknown 
    : STATUS_MESSAGES.unknown;

  return (
    <div className="chat">
      <div className="chat__scroll-area">
        <div className="chat__layout">
          <div className="chat__messages">
            {messages.length === 0 && (
              <div className="chat__welcome">
                <Logo variant="full" />
                <p className="chat__welcome-text">Ask a question about your data</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                blocks={msg.blocks}
                exportUrl={msg.exportUrl}
                onClarify={handleClarification}
                onExport={handleExport}
                isLastMessage={index === messages.length - 1}
              />
            ))}
            {pending && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__bubble">
                  <div className="chat-message__pending">
                    <div className="loader"></div>
                    <span className="chat-message__pending-text">{currentStatusInfo.text}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="chat__footer-wrapper">
        <div className="chat__footer">
          <ChatInput
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSubmit={handleSendMessage}
            placeholder="Ask anything about your data..."
          />
        </div>
      </div>
    </div>
  );
}
