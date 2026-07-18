import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/button';
import { NavSelectItem } from '../../../shared/ui/nav-select-item';
import { SidebarSection } from '../../app/components/SidebarSection';
import { Icon } from '@iconify/react';
import { Confirm } from '../../../shared/ui/confirm';
import { Modal } from '../../../shared/ui/modal';
import { Field } from '../../../shared/ui/field';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import type { ChatSession, ChatFolder } from '../types';
import './ChatHistory.css';

interface ChatHistoryProps {
  sessions: ChatSession[];
  folders: ChatFolder[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onRenameChat?: (id: string, newTitle: string) => void;
  onDeleteChat?: (id: string) => void;
  onCreateFolder?: (name: string) => Promise<ChatFolder | null>;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onDeleteFolder?: (folderId: string, deleteChats: boolean) => Promise<void>;
  onMoveChatToFolder?: (chatId: string, folderId: string) => Promise<void>;
  onRemoveChatFromFolder?: (chatId: string) => Promise<void>;
  blocked?: boolean;
}

interface FolderActionMenuProps {
  onRename: () => void;
  onDelete: () => void;
}

function FolderActionMenu({ onRename, onDelete }: FolderActionMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
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
      const menuEl = document.getElementById('folder-action-portal');
      if (menuEl && menuEl.contains(event.target as Node)) return;
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
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
        aria-label="Folder options"
      >
        <Icon icon="mdi:dots-vertical" width="20" height="20" />
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div id="folder-action-portal" className="chat-action-menu__dropdown" style={menuStyle}>
          <button type="button" onClick={() => { setOpen(false); onRename(); }}>
            {t('chat.rename')}
          </button>
          <button type="button" className="chat-action-menu__delete" onClick={() => { setOpen(false); onDelete(); }}>
            {t('chat.delete')}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

interface ChatActionMenuWithMoveProps {
  onRename: () => void;
  onDelete: () => void;
  onMoveToFolder: () => void;
}

function ChatActionMenuWithMove({ onRename, onDelete, onMoveToFolder }: ChatActionMenuWithMoveProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
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
      const menuEl = document.getElementById('chat-move-action-portal');
      if (menuEl && menuEl.contains(event.target as Node)) return;
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
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
        <div id="chat-move-action-portal" className="chat-action-menu__dropdown" style={menuStyle}>
          <button type="button" onClick={() => { setOpen(false); onMoveToFolder(); }}>
            {t('chat.move_to_folder')}
          </button>
          <button type="button" onClick={() => { setOpen(false); onRename(); }}>
            {t('chat.rename')}
          </button>
          <button type="button" className="chat-action-menu__delete" onClick={() => { setOpen(false); onDelete(); }}>
            {t('chat.delete')}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export function ChatHistory({
  sessions,
  folders,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveChatToFolder,
  onRemoveChatFromFolder,
  blocked = false
}: ChatHistoryProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Chat CRUD state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<{id: string, title: string} | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Folder CRUD state
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderRenameValue, setFolderRenameValue] = useState('');
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deleteFolderWithChats, setDeleteFolderWithChats] = useState(false);

  // Move to folder state
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);

  // Build grouped structure
  const groupedContent = useMemo(() => {
    const folderChats = new Map<string, ChatSession[]>();
    const uncategorized: ChatSession[] = [];
    const folderOrder: string[] = [];

    for (const s of sessions) {
      if (s.folderId) {
        const existing = folderChats.get(s.folderId) || [];
        if (existing.length === 0) folderOrder.push(s.folderId);
        existing.push(s);
        folderChats.set(s.folderId, existing);
      } else {
        uncategorized.push(s);
      }
    }

    // Build merged display list: walk sessions in order, render folder groups at first encounter
    const renderedFolders = new Set<string>();
    const items: Array<{ type: 'folder'; folderId: string; children: ChatSession[] } | { type: 'chat'; session: ChatSession }> = [];

    for (const s of sessions) {
      if (s.folderId) {
        if (!renderedFolders.has(s.folderId)) {
          renderedFolders.add(s.folderId);
          items.push({ type: 'folder', folderId: s.folderId, children: folderChats.get(s.folderId) || [] });
        }
      } else {
        items.push({ type: 'chat', session: s });
      }
    }

    return items;
  }, [sessions]);

  // Chat rename handlers
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

  // Folder rename handlers
  const handleFolderRenameStart = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    setFolderRenameValue(folder?.name || '');
    setRenamingFolderId(folderId);
  };

  const handleFolderRenameSubmit = () => {
    if (renamingFolderId && folderRenameValue.trim() !== '') {
      onRenameFolder?.(renamingFolderId, folderRenameValue.trim());
    }
    setRenamingFolderId(null);
  };

  const handleFolderDeleteConfirm = () => {
    if (deletingFolderId) {
      onDeleteFolder?.(deletingFolderId, deleteFolderWithChats);
    }
    setDeletingFolderId(null);
    setDeleteFolderWithChats(false);
  };

  // Move to folder handlers
  const handleMoveToFolderSubmit = async () => {
    if (!movingChatId) return;
    setMoveLoading(true);
    try {
      if (newFolderName.trim() && onCreateFolder) {
        const folder = await onCreateFolder(newFolderName.trim());
        if (folder && onMoveChatToFolder) {
          await onMoveChatToFolder(movingChatId, folder.id);
        }
      } else if (selectedFolderId === '__none__') {
        await onRemoveChatFromFolder?.(movingChatId);
      } else if (selectedFolderId && onMoveChatToFolder) {
        await onMoveChatToFolder(movingChatId, selectedFolderId);
      }
    } finally {
      setMoveLoading(false);
      setMovingChatId(null);
      setSelectedFolderId(null);
      setNewFolderName('');
    }
  };

  const handleMoveModalClose = () => {
    setMovingChatId(null);
    setSelectedFolderId(null);
    setNewFolderName('');
  };

  const activeFolderIds = useMemo(() => new Set(sessions.filter(s => s.folderId).map(s => s.folderId)), [sessions]);

  return (
    <>
      <SidebarSection title={t('sidebar.chats', { defaultValue: 'History' })} className="chat-history">
        <nav className="chat-history__sessions">
          {groupedContent.map(item => {
            if (item.type === 'folder') {
              const folder = folders.find(f => f.id === item.folderId);
              if (!folder) return null;
              const count = item.children.length;
              return (
                <div key={`folder-${folder.id}`}>
                  <div className="chat-history__folder-header">
                    <Icon icon="mdi:folder" width="18" height="18" />
                    <span className="chat-history__folder-name">{folder.name}</span>
                    {!blocked && (
                      <FolderActionMenu
                        onRename={() => handleFolderRenameStart(folder.id)}
                        onDelete={() => setDeletingFolderId(folder.id)}
                      />
                    )}
                  </div>
                  <div className="chat-history__folder-children">
                    {item.children.map(session => (
                      <NavSelectItem
                        key={session.id}
                        label={session.title}
                        active={session.id === activeSessionId}
                        onClick={() => onSelectSession(session.id)}
                        actions={blocked ? undefined : (
                          <ChatActionMenuWithMove
                            onRename={() => handleRenameStart(session.id, session.title)}
                            onDelete={() => setDeletingId(session.id)}
                            onMoveToFolder={() => {
                              setMovingChatId(session.id);
                              setSelectedFolderId(session.folderId || null);
                            }}
                          />
                        )}
                      />
                    ))}
                  </div>
                </div>
              );
            }
            const session = item.session;
            return (
              <NavSelectItem
                key={session.id}
                label={session.title}
                active={session.id === activeSessionId}
                onClick={() => onSelectSession(session.id)}
                actions={blocked ? undefined : (
                  <ChatActionMenuWithMove
                    onRename={() => handleRenameStart(session.id, session.title)}
                    onDelete={() => setDeletingId(session.id)}
                    onMoveToFolder={() => {
                      setMovingChatId(session.id);
                      setSelectedFolderId(session.folderId || null);
                    }}
                  />
                )}
              />
            );
          })}
        </nav>
      </SidebarSection>

      {/* Delete Chat Confirmation */}
      <Confirm
        isOpen={deletingId !== null}
        onConfirm={handleDeleteSubmit}
        onCancel={() => setDeletingId(null)}
        title={t('chat.delete_chat')}
        confirmText={t('chat.delete')}
        cancelText={t('chat.cancel')}
      >
        {t('chat.delete_chat_confirm')}
      </Confirm>

      {/* Rename Chat Modal */}
      <Modal isOpen={renamingSession !== null} onClose={() => setRenamingSession(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{t('chat.rename_chat')}</h2>
          <Field
            value={renameInputValue}
            onChange={(e) => setRenameInputValue(e.target.value)}
            placeholder={t('chat.enter_new_name')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleRenameSubmit(); }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setRenamingSession(null)}>{t('chat.cancel')}</Button>
            <Button onClick={handleRenameSubmit} disabled={!renameInputValue.trim()}>{t('chat.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Folder Modal */}
      <Modal isOpen={renamingFolderId !== null} onClose={() => setRenamingFolderId(null)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{t('chat.rename_folder')}</h2>
          <Field
            value={folderRenameValue}
            onChange={(e) => setFolderRenameValue(e.target.value)}
            placeholder={t('chat.enter_folder_name')}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleFolderRenameSubmit(); }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={() => setRenamingFolderId(null)}>{t('chat.cancel')}</Button>
            <Button onClick={handleFolderRenameSubmit} disabled={!folderRenameValue.trim()}>{t('chat.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Folder Confirmation */}
      <Confirm
        isOpen={deletingFolderId !== null}
        onConfirm={handleFolderDeleteConfirm}
        onCancel={() => { setDeletingFolderId(null); setDeleteFolderWithChats(false); }}
        title={t('chat.delete_folder')}
        confirmText={t('chat.delete')}
        cancelText={t('chat.cancel')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span>{t('chat.delete_folder_confirm')}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={deleteFolderWithChats}
              onChange={(e) => setDeleteFolderWithChats(e.target.checked)}
            />
            {t('chat.delete_folder_chats')}
          </label>
        </div>
      </Confirm>

      {/* Move to Folder Modal */}
      <Modal isOpen={movingChatId !== null} onClose={handleMoveModalClose}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>{t('chat.move_to_folder')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
            <button
              type="button"
              onClick={() => {
                setSelectedFolderId('__none__');
                setNewFolderName('');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: selectedFolderId === '__none__' ? 'var(--color-primary, #4A6CF7)' : 'transparent',
                color: selectedFolderId === '__none__' ? '#fff' : 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
              }}
            >
              <Icon icon="mdi:folder-off" width="18" height="18" />
              <span>{t('chat.no_folder')}</span>
            </button>
            <div style={{ height: '1px', background: 'var(--color-border, #e0e0e0)', margin: '4px 0' }} />
            {folders
              .filter(f => activeFolderIds.has(f.id))
              .map(folder => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setNewFolderName('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    background: selectedFolderId === folder.id ? 'var(--color-primary, #4A6CF7)' : 'transparent',
                    color: selectedFolderId === folder.id ? '#fff' : 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                  }}
                >
                  <Icon icon="mdi:folder" width="18" height="18" />
                  <span>{folder.name}</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: '12px' }}>{folder.chatCount}</span>
                </button>
              ))}
            {folders.filter(f => activeFolderIds.has(f.id)).length === 0 && (
              <span style={{ opacity: 0.6, padding: '8px 12px', fontSize: '13px' }}>
                {t('chat.no_folders')}
              </span>
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--color-border, #e0e0e0)', paddingTop: '12px' }}>
            <Field
              value={newFolderName}
              onChange={(e) => {
                setNewFolderName(e.target.value);
                if (e.target.value.trim()) setSelectedFolderId(null);
              }}
              placeholder={t('chat.create_new_folder_placeholder')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <Button variant="secondary" onClick={handleMoveModalClose}>{t('chat.cancel')}</Button>
            <Button
              onClick={handleMoveToFolderSubmit}
              disabled={moveLoading || (!selectedFolderId && !newFolderName.trim())}
            >
              {moveLoading ? t('common.loading') : t('chat.move')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
