import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../../../shared/ui/avatar';
import { Logo } from '../../../shared/ui/logo';
import { Icon } from '@iconify/react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isOpen ? 'sidebar--open' : 'sidebar--closed'}`}
    >
      <div className="sidebar__header">
        <div className="sidebar__logo-container">
          <Logo variant="full" />
        </div>
        <button
          type="button"
          className="sidebar__menu-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <Icon icon="mdi:format-list-bulleted" width="28" height="28" color="#8A92A6" />
        </button>
      </div>

      <div className="sidebar__content">
        {children}
      </div>

      <div className="sidebar__footer">
        <button
          className="sidebar__user"
          onClick={() => navigate('/profile')}
          type="button"
        >
          <Avatar src={user?.profile?.avatar_url} size="sm" />
          <span className="sidebar__user-email">{user?.email ?? 'user@example.com'}</span>
        </button>
        <button
          className="sidebar__logout-btn"
          onClick={handleLogout}
          aria-label="Log out"
          type="button"
        >
          <Icon icon="mdi:logout" />
        </button>
      </div>
    </aside>
  );
}
