import "./Logo.css";
import type { LogoProps } from "./Logo.types";

export function Logo({ variant = "full", className = "" }: LogoProps) {
  const classNames = ["logo", `logo--${variant}`, className].filter(Boolean).join(" ");

  return (
    <div className={classNames} aria-label="NLEx">
      <p className="logo__title">NLEx</p>
      {variant === "full" && (
        <p className="logo__subtitle">Natural Language to Excel</p>
      )}
    </div>
  );
}
