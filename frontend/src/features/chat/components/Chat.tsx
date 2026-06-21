import { useCallback, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { ChatInput } from '../../../shared/ui/chat-input';
import { ChatMessage } from '../../../shared/ui/chat-message';
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
}

export function Chat({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleClarification,
  pending,
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
  }, [messages]);

  return (
    <div className="chat">
      <div className="chat__scroll-area">
        <div className="chat__layout">
          <div className="chat__messages">
            {messages.length === 0 && (
              <div className="chat__messages-empty">
                Start a conversation by typing a message below.
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                blocks={msg.blocks}
                exportUrl={msg.exportUrl}
                onClarify={handleClarification}
                onExport={handleExport}
              />
            ))}
            {pending && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__bubble">
                  <div className="chat-message__pending">
                    <Icon icon="mdi:loading" className="chat-message__pending-icon" />
                    <span>Processing...</span>
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
