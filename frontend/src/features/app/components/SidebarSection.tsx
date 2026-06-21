import { useState, type ReactNode } from 'react';
import { Icon } from '@iconify/react';
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
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <section className={`sidebar-section ${className}`.trim()}>
      <div className="sidebar-section__header">
        <button
          type="button"
          className="sidebar-section__title"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!isCollapsed}
        >
          {title}
        </button>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            className="sidebar-section__toggle-btn"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            <Icon icon={isCollapsed ? "mdi:chevron-down" : "mdi:chevron-up"} color="#8A92A6" width="20" height="20" />
          </button>
        </div>
      </div>
      {!isCollapsed && <div className="sidebar-section__body">{children}</div>}
    </section>
  );
}
