import { type ReactNode } from 'react';
import { Icon } from '@iconify/react';
import { useLocalStorage } from '../../../shared/hooks/useLocalStorage';
import './SidebarSection.css';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

export function SidebarSection({
  title,
  children,
  className = '',
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
        <Icon 
          icon="mdi:chevron-down" 
          color="#8A92A6" 
          width="20" 
          height="20" 
          className="sidebar-section__icon"
        />
      </div>
      <div className="sidebar-section__content" aria-expanded={!isCollapsed}>
        <div className="sidebar-section__body">
          <div className="sidebar-section__body-inner">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
