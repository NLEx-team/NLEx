import { useEffect, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../../../shared/ui/avatar';
import { Button } from '../../../shared/ui/button';
import { NavSelectItem } from '../../../shared/ui/nav-select-item';
import { Icon } from '@iconify/react';
import type { ChatSession } from '../types';
import './ChatSidebar.css';

interface ChatSidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onClose: () => void;
}

export function ChatSidebar({ isOpen, sessions, activeSessionId, onSelectSession, onClose }: ChatSidebarProps) {
  const { user } = useAuth();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <aside
      ref={sidebarRef}
      className={`chat-sidebar ${isOpen ? 'chat-sidebar--open' : 'chat-sidebar--closed'}`}
    >
      <div className="chat-sidebar__header">
        <h2 className="chat-sidebar__title">NLEx Chats</h2>
        <Button variant="secondary" onClick={onClose}>
          <Icon icon="mdi:menu-close" />
        </Button>
      </div>

      <div className="chat-sidebar__content">
        <Button variant="primary" className="chat-sidebar__new-chat-btn">
          <Icon icon="mdi:plus" />
          <span>New Chat</span>
        </Button>

        <nav className="chat-sidebar__sessions">
          {sessions.map(session => (
            <NavSelectItem
              key={session.id}
              label={session.title}
              active={session.id === activeSessionId}
              onClick={() => onSelectSession(session.id)}
            />
          ))}
        </nav>
      </div>

      <div className="chat-sidebar__footer">
        <div className="chat-sidebar__user">
          <Avatar src={user?.profile?.avatar_url} size="sm" />
          <span className="chat-sidebar__user-email">{user?.email ?? 'user@example.com'}</span>
        </div>
      </div>
    </aside>
  );
}
