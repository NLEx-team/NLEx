import { useTranslation } from "react-i18next";
import "./AuthToggle.css";
import type { AuthToggleProps } from "./AuthToggle.types";

export function AuthToggle({ value, onChange, className = "" }: AuthToggleProps) {
  const { t } = useTranslation();
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
        {t('auth.login')}
      </button>

      <button
        type="button"
        className="auth-toggle__segment"
        aria-pressed={value === "register"}
        onClick={() => onChange("register")}
      >
        {t('auth.register')}
      </button>
    </div>
  );
}
