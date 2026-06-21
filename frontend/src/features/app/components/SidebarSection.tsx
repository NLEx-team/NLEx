import { type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import './SidebarSection.css';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  onAdd?: () => void;
  defaultCollapsed?: boolean;
}

export function SidebarSection({
  title,
  children,
  className = '',
  onAdd,
  defaultCollapsed = true,
}: SidebarSectionProps) {
  const storageKey = `sidebar-section:${title}`;
  const [isCollapsed, setIsCollapsed] = useLocalStorage(storageKey, defaultCollapsed);

  const toggleCollapse = () => setIsCollapsed((c) => !c);

  return (
    <section className={`sidebar-section ${className}`.trim()}>
      <div
        className="sidebar-section__header"
        onClick={toggleCollapse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCollapse();
          }
        }}
        aria-expanded={!isCollapsed}
      >
        <span className="sidebar-section__title">{title}</span>
        <Icon icon={isCollapsed ? 'mdi:chevron-down' : 'mdi:chevron-up'} color="#8A92A6" width="20" height="20" />
      </div>
      {!isCollapsed && <div className="sidebar-section__body">{children}</div>}
    </section>
  );
}
