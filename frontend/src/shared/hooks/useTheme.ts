import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

const STORAGE_KEY = "theme";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
  }
  return "light";
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function initTheme(): Theme {
  const theme = readStoredTheme();
  applyTheme(theme);
  return theme;
}

export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}
