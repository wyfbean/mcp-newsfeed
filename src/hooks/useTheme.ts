/**
 * useTheme – reads / toggles the current colour scheme.
 *
 * Stores the preference in localStorage and applies the "dark" class to
 * <html> so Tailwind's dark-mode utilities work.
 */
"use client";

import { useState, useEffect } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.toggle("dark", prefersDark);
  } else {
    html.classList.toggle("dark", theme === "dark");
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const initial = stored ?? "system";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return { theme, setTheme: changeTheme };
}
