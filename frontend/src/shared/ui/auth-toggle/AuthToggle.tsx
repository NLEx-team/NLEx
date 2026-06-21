import "./AuthToggle.css";
import type { AuthToggleProps } from "./AuthToggle.types";

export function AuthToggle({ value, onChange, className = "" }: AuthToggleProps) {
  const classNames = ["auth-toggle", className].filter(Boolean).join(" ");
  return (
    <div className={classNames} role="group" aria-label="Authentication mode">
      <div
        className="auth-toggle__slider"
        style={{ left: value === "register" ? "50%" : "0%" }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="auth-toggle__segment"
        aria-pressed={value === "login"}
        onClick={() => onChange("login")}
      >
        Login
      </button>

      <button
        type="button"
        className="auth-toggle__segment"
        aria-pressed={value === "register"}
        onClick={() => onChange("register")}
      >
        Register
      </button>
    </div>
  );
}
