import { useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../../../shared/ui/avatar';
import { Button } from '../../../shared/ui/button';
import { Icon } from '@iconify/react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
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
      className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}
    >
      <div className="sidebar__header">
        <h2 className="sidebar__title">NLEx</h2>
        <Button variant="secondary" onClick={onClose}>
          <Icon icon="mdi:menu-close" />
        </Button>
      </div>

      <div className="sidebar__content">
        {children}
      </div>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <Avatar src={user?.profile?.avatar_url} size="sm" />
          <span className="sidebar__user-email">{user?.email ?? 'user@example.com'}</span>
        </div>
      </div>
    </aside>
  );
}
