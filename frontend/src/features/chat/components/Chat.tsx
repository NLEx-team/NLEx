import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

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
  blocked?: boolean;
}



export function Chat({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleClarification,
  pending,
  pendingStatus,
  blocked = false,
}: ChatProps) {
  const { t } = useTranslation();

  const STATUS_MESSAGES: Record<string, { text: string }> = {
    unknown: { text: t('chat.status_starting') },
    IDLE: { text: t('chat.status_starting') },
    CATALOG_CONNECTING: { text: t('chat.status_connecting') },
    RELATIONSHIP_INFERRING: { text: t('chat.status_analyzing') },
    GENERATING_SQL: { text: t('chat.status_generating') },
    EXECUTING_SQL: { text: t('chat.status_executing') },
    FIXING_SQL: { text: t('chat.status_fixing') },
    COMPLETED: { text: t('chat.status_formatting') },
    FAILED: { text: t('chat.status_failed') },
  };

  const handleExport = useCallback((exportUrl: string, filename?: string) => {
    chatApi.downloadExport(exportUrl, filename).catch((err) => {
      console.error('Export download failed:', err);
      alert(t('common.failed_download'));
    });
  }, [t]);
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
              </div>
            )}
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                blocks={msg.blocks}
                exportUrl={msg.exportUrl}
                exportFilename={msg.exportFilename}
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
            placeholder={blocked ? t('blocked.input_disabled') : t('chat.placeholder')}
            disabled={blocked}
          />
        </div>
      </div>
    </div>
  );
}
