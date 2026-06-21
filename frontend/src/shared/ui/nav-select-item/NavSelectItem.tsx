import "./NavSelectItem.css";
import type { NavSelectItemProps } from "./NavSelectItem.types";

export function NavSelectItem({
  label,
  active = false,
  onClick,
  className = "",
}: NavSelectItemProps) {
  const classNames = [
    "nav-select-item",
    active ? "nav-select-item--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
    >
      {label}
    </button>
  );
}
