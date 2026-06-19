import "./Button.css";
import type { ButtonProps } from "./Button.types";

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = ""
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}