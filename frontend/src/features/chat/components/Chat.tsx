import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '../../../shared/ui/button';
import { ChatInput } from '../../../shared/ui/chat-input';
import { ChatMessage } from '../../../shared/ui/chat-message';
import type { ChatMessage as ChatMessageType } from '../types';
import './Chat.css';

interface ChatProps {
  activeSessionTitle?: string;
  messages: ChatMessageType[];
  inputValue: string;
  setInputValue: (value: string) => void;
  handleSendMessage: () => void;
  onToggleSidebar: () => void;
}

export function Chat({
  activeSessionTitle,
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
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
            <Button variant="secondary">
              <Icon icon="mdi:share-outline" />
            </Button>
          </div>
        </header>

        <div className="chat__messages">
          {messages.length === 0 && (
            <div className="chat__messages-empty">
              Start a conversation by typing a message below.
            </div>
          )}
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} role={msg.role} content={msg.content} />
          ))}
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
