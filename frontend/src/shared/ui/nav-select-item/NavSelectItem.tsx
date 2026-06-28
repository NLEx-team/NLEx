import "./NavSelectItem.css";
import type { NavSelectItemProps } from "./NavSelectItem.types";

export function NavSelectItem({
  label,
  active = false,
  onClick,
  className = "",
  actions,
}: NavSelectItemProps) {
  const classNames = [
    "nav-select-item-container",
    active ? "nav-select-item-container--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <button
        type="button"
        className="nav-select-item__button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
      >
        <span className="nav-select-item__label" title={label}>{label}</span>
      </button>
      {actions && (
        <div className="nav-select-item__actions">
          {actions}
        </div>
      )}
    </div>
  );
}
