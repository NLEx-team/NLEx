import { Icon } from "@iconify/react";
import { IconWrapper } from "../icon";
import type { ThemeIconButtonProps } from "./ThemeIconButton.types";
import "./ThemeIconButton.css";

const THEME_ICONS = {
  light: "mdi:weather-sunny",
  dark: "mdi:moon-waning-crescent",
} as const;

const THEME_LABELS = {
  light: "Switch to dark mode",
  dark: "Switch to light mode",
} as const;

export function ThemeIconButton({ theme, onClick, className = "" }: ThemeIconButtonProps) {
  const classNames = ["theme-icon-button", className].filter(Boolean).join(" ");

  return (
    <IconWrapper
      onClick={onClick}
      aria-label={THEME_LABELS[theme]}
      className={classNames}
    >
      <Icon icon={THEME_ICONS[theme]} aria-hidden="true" />
    </IconWrapper>
  );
}
