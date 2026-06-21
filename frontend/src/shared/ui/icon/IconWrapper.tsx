import "./IconWrapper.css";
import type { IconWrapperProps } from "./IconWrapper.types";

export function IconWrapper({
  children,
  onClick,
  "aria-label": ariaLabel,
  className = "",
}: IconWrapperProps) {
  const classNames = ["icon", onClick ? "icon--clickable" : "", className]
    .filter(Boolean)
    .join(" ");

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </button>
    );
  }

  return <span className={classNames}>{children}</span>;
}
