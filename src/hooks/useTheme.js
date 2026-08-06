import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "et_theme";

export function useTheme(themeFromData, setThemePreference) {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "dark");

  useEffect(() => {
    if (themeFromData) setTheme(themeFromData);
  }, [themeFromData]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (setThemePreference) setThemePreference(next);
  }, [theme, setThemePreference]);

  return { theme, toggleTheme };
}
