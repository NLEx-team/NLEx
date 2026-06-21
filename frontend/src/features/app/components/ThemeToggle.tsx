import { ThemeIconButton } from "../../../shared/ui";
import { useTheme } from "../../../shared/hooks";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "app-theme-toggle" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return <ThemeIconButton theme={theme} onClick={toggleTheme} className={className} />;
}
