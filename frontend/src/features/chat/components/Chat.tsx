import { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '../../../shared/ui/button';
import { ChatInput } from '../../../shared/ui/chat-input';
import { ChatMessage } from '../../../shared/ui/chat-message';
import { ChatSidebar } from './ChatSidebar';
import { useChat } from '../hooks/useChat';
import './Chat.css';

export function Chat() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    inputValue,
    setInputValue,
    setActiveSessionId,
    handleSendMessage,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat">
      <ChatSidebar
        isOpen={isSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="chat__layout">
        <header className="chat__header">
          <button
            className="chat__menu-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Icon icon="mdi:menu" />
          </button>
          <h1 className="chat__title">
            {activeSession?.title ?? 'Chat'}
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
