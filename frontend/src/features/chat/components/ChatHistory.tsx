import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../../shared/ui/button';
import { NavSelectItem } from '../../../shared/ui/nav-select-item';
import { SidebarSection } from '../../app/components/SidebarSection';
import { Icon } from '@iconify/react';
import { Confirm } from '../../../shared/ui/confirm';
import { Modal } from '../../../shared/ui/modal';
import { Field } from '../../../shared/ui/field';
import type { ChatSession } from '../types';
import './ChatHistory.css';

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat?: () => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onDeleteChat?: (id: string) => void;
}

function ChatActionMenu({ 
  onRename, 
  onDelete 
}: { 
  onRename: () => void; 
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position the menu fixed relative to the viewport
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
        zIndex: 9999,
      });
    }
    setOpen(!open);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      // Allow clicking inside the menu
      const menuEl = document.getElementById('chat-action-portal');
      if (menuEl && menuEl.contains(event.target as Node)) return;
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleScroll = () => {
      setOpen(false);
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // Close on any scroll
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className="chat-action-menu" ref={containerRef} onClick={e => e.stopPropagation()}>
      <button 
        type="button" 
        className="chat-action-menu__trigger"
        ref={triggerRef}
        onClick={toggleOpen}
        aria-label="Chat options"
      >
        <Icon icon="mdi:dots-vertical" width="20" height="20" />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div id="chat-action-portal" className="chat-action-menu__dropdown" style={menuStyle}>
          <button 
            type="button" 
            onClick={() => { setOpen(false); onRename(); }}
          >
            Изменить
          </button>
          <button 
            type="button" 
            className="chat-action-menu__delete"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            Удалить
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export function ChatHistory({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewChat,
  onRenameChat,
  onDeleteChat
}: ChatHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<{id: string, title: string} | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  const handleRenameStart = (id: string, oldTitle: string) => {
    setRenameInputValue(oldTitle);
    setRenamingSession({ id, title: oldTitle });
  };

  const handleRenameSubmit = () => {
    if (renamingSession && renameInputValue.trim() !== '' && renameInputValue !== renamingSession.title) {
      onRenameChat?.(renamingSession.id, renameInputValue.trim());
    }
    setRenamingSession(null);
  };

  const handleDeleteSubmit = () => {
    if (deletingId) {
      onDeleteChat?.(deletingId);
    }
    setDeletingId(null);
  };

  return (
    <>
      <button className="sidebar__new-chat-btn" onClick={onNewChat} type="button">
        <Icon icon="mdi:plus" width="20" height="20" />
        <span>New chat</span>
      </button>

      <SidebarSection title="History" className="chat-history">
        <nav className="chat-history__sessions">
          {sessions.map(session => (
            <NavSelectItem
              key={session.id}
              label={session.title}
              active={session.id === activeSessionId}
              onClick={() => onSelectSession(session.id)}
              actions={
                <ChatActionMenu 
                  onRename={() => handleRenameStart(session.id, session.title)}
                  onDelete={() => setDeletingId(session.id)}
                />
              }
            />
          ))}
        </nav>
      </SidebarSection>

      {/* Delete Confirmation Modal */}
      <Confirm
        isOpen={deletingId !== null}
        onConfirm={handleDeleteSubmit}
        onCancel={() => setDeletingId(null)}
        title="Удаление чата"
        confirmText="Удалить"
        cancelText="Отмена"
      >
        Вы уверены, что хотите удалить этот чат? Это действие нельзя отменить.
      </Confirm>

      {/* Rename Chat Modal */}
      <Modal isOpen={renamingSession !== null} onClose={() => setRenamingSession(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>Переименовать чат</h2>
          <Field 
            value={renameInputValue}
            onChange={(e) => setRenameInputValue(e.target.value)}
            placeholder="Введите новое название"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameSubmit();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setRenamingSession(null)}>Отмена</Button>
            <Button onClick={handleRenameSubmit} disabled={!renameInputValue.trim()}>Сохранить</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
