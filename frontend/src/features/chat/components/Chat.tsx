import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { ChatInput } from '../../../shared/ui/chat-input';
import { ChatMessage } from '../../../shared/ui/chat-message';
import { ThemeToggle } from '../../app/components/ThemeToggle';
import type { ChatMessage as ChatMessageType } from '../types';
import './Chat.css';

interface ChatProps {
  activeSessionTitle?: string;
  messages: ChatMessageType[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  handleClarification: (questionId: string, selectedOptions: string[]) => void;
  pending: boolean;
  onToggleSidebar: () => void;
}

export function Chat({
  activeSessionTitle,
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  handleClarification,
  pending,
  onToggleSidebar,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat">
      <div className="chat__layout">
        <header className="chat__header">
          <button
            className="chat__menu-btn"
            onClick={onToggleSidebar}
            aria-label="Open sidebar"
          >
            <Icon icon="mdi:menu" />
          </button>
          <h1 className="chat__title">
            {activeSessionTitle ?? 'Chat'}
          </h1>
          <div className="chat__header-actions">
            <button type="button" className="chat__menu-btn" aria-label="Share chat">
              <Icon icon="mdi:share-outline" />
            </button>
            <ThemeToggle className="chat__menu-btn" />
          </div>
        </header>

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
              onClarify={handleClarification}
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
