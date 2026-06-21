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
      <div className="sidebar-section__header catalog-manager__header">
        <button
          type="button"
          className="sidebar-section__title catalog-manager__title"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          aria-expanded={!isCollapsed}
        >
          {title}
        </button>
        <button
          type="button"
          className="sidebar-section__add-btn catalog-manager__add-btn"
          onClick={onAdd}
          disabled={!onAdd}
          title="Add"
          aria-label="Add"
        >
          <Icon icon="mdi:plus" />
        </button>
      </div>
      {!isCollapsed && <div className="sidebar-section__body">{children}</div>}
    </section>
  );
}
