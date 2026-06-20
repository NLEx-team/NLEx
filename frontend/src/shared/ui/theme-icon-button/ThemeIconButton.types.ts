export type ThemeIconButtonTheme = "light" | "dark";

export interface ThemeIconButtonProps {
  theme: ThemeIconButtonTheme;
  onClick: () => void;
  className?: string;
}
