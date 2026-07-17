import { useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Avatar } from '../../../shared/ui/avatar';
import { Logo } from '../../../shared/ui/logo';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  children: ReactNode;
}

export function Sidebar({ isOpen, onClose, onNewChat, children }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
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
          <Logo variant="compact" />
        </div>
        <button
          type="button"
          className="sidebar__menu-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <Icon icon="lucide:sidebar-close" width="28" height="28" color="#8A92A6" />
        </button>
      </div>

      <div className="sidebar__actions">
        <button className="sidebar__action-btn" onClick={() => { onNewChat?.(); navigate('/chat'); }} type="button">
          <Icon icon="jam:write" width="20" height="20" />
          <span>{t('sidebar.new_chat')}</span>
        </button>
        {user?.role === 'admin' && (
          <button className="sidebar__action-btn" onClick={() => navigate('/admin/databases')} type="button">
            <Icon icon="tabler:database-edit" width="20" height="20" />
            <span>{t('sidebar.manage_databases')}</span>
          </button>
        )}
        {user?.role === 'admin' && (
          <button className="sidebar__action-btn" onClick={() => navigate('/admin')} type="button">
            <Icon icon="mingcute:settings-6-line" width="20" height="20" />
            <span>{t('sidebar.admin_panel')}</span>
          </button>
        )}
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
          aria-label={t('sidebar.logout', { defaultValue: 'Log out' })}
          title={t('sidebar.logout', { defaultValue: 'Log out' })}
          type="button"
        >
          <Icon icon="mdi:logout" />
        </button>
      </div>
    </aside>
  );
}
