import { useSyncExternalStore } from "react";

export type Theme = "red" | "light" | "dark";
export const THEME_KEY = "flowsync-theme";
export const DEFAULT_THEME: Theme = "red";

const listeners = new Set<() => void>();
let current: Theme = DEFAULT_THEME;

function readStored(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const v = localStorage.getItem(THEME_KEY);
  return v === "red" || v === "light" || v === "dark" ? v : DEFAULT_THEME;
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  if (theme === "dark") document.documentElement.classList.add("dark");
  else document.documentElement.classList.remove("dark");
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme) {
  current = theme;
  if (typeof window !== "undefined") {
    localStorage.setItem(THEME_KEY, theme);
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

export function initTheme() {
  current = readStored();
  applyTheme(current);
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => DEFAULT_THEME,
  );
}