import { Button } from '../../../shared/ui/button';
import { NavSelectItem } from '../../../shared/ui/nav-select-item';
import { SidebarSection } from '../../app/components/SidebarSection';
import type { ChatSession } from '../types';
import './ChatHistory.css';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
}

export function ChatHistory({ sessions, activeSessionId, onSelectSession }: ChatHistoryProps) {
  return (
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
  );
}
