import { Icon } from '@iconify/react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import './AppHeader.css';

interface AppHeaderProps {
  title: string;
  variant: 'chat' | 'profile';
  isSidebarOpen?: boolean;
  onOpenSidebar?: () => void;
  onBack?: () => void;
}

export function AppHeader({
  title,
  variant,
  isSidebarOpen,
  onOpenSidebar,
  onBack,
}: AppHeaderProps) {
  const showMenuButton = variant === 'chat' && !isSidebarOpen && onOpenSidebar;
  const showBackButton = variant === 'profile' && onBack;

  return (
    <header className="app-header">
      <div className="app-header__left">
        {showMenuButton && (
          <button
            type="button"
            className="app-header__icon-btn"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            <Icon icon="mdi:menu" />
          </button>
        )}
        {showBackButton && (
          <button
            type="button"
            className="app-header__icon-btn"
            onClick={onBack}
            aria-label="Back"
          >
            <Icon icon="mdi:arrow-left" />
          </button>
        )}
      </div>
      <h1 className="app-header__title">{title}</h1>
      <div className="app-header__actions">
        <LanguageToggle />
        <ThemeToggle className="app-header__icon-btn" />
      </div>
    </header>
  );
}
