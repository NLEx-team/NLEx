import { Button } from '../../../shared/ui/button';
import { NavSelectItem } from '../../../shared/ui/nav-select-item';
import { SidebarSection } from '../../app/components/SidebarSection';
import { Icon } from '@iconify/react';
import type { ChatSession } from '../types';
import './ChatHistory.css';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat?: () => void;
}

export function ChatHistory({ sessions, activeSessionId, onSelectSession, onNewChat }: ChatHistoryProps) {
  return (
    <>
      <Button variant="secondary" className="button--field chat-history__new-chat-btn" onClick={onNewChat}>
        <Icon icon="mdi:plus" />
        <span>New Chat</span>
      </Button>

      <SidebarSection title="Chats" className="chat-history">
        <nav className="chat-history__sessions">
          {sessions.map(session => (
            <NavSelectItem
              key={session.id}
              label={session.title}
              active={session.id === activeSessionId}
              onClick={() => onSelectSession(session.id)}
            />
          ))}
        </nav>
      </SidebarSection>
    </>
  );
}
