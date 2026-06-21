import "./Button.css";
import type { ButtonProps } from "./Button.types";

export function Button({
  children,
  type = "button",
  onClick,
  disabled,
  variant = "primary",
  className = "",
  style
}: ButtonProps) {
  return (
    <button
      type={type}
      style={style}
      className={`button button--${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}