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
          {onAdd && (
            <button
              type="button"
              className="sidebar-section__add-btn"
              onClick={onAdd}
              title="Add"
              aria-label="Add"
            >
              <Icon icon="mdi:playlist-plus" />
            </button>
          )}
          <button
            type="button"
            className="sidebar-section__add-btn"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            title={isCollapsed ? "Expand" : "Collapse"}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            <Icon icon={isCollapsed ? "mdi:plus" : "mdi:minus"} />
          </button>
        </div>
      </div>
      {!isCollapsed && <div className="sidebar-section__body">{children}</div>}
    </section>
  );
}
