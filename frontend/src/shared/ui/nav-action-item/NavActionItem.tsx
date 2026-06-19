import "./NavActionItem.css";
import type { NavActionItemProps } from "./NavActionItem.types";

export function NavActionItem({
  label,
  iconRight,
  onClick,
  className = "",
}: NavActionItemProps) {
  const classNames = ["nav-action-item", className].filter(Boolean).join(" ");

  return (
    <button type="button" className={classNames} onClick={onClick}>
      <span className="nav-action-item__label">{label}</span>
      {iconRight && <span className="nav-action-item__icon">{iconRight}</span>}
    </button>
  );
}
