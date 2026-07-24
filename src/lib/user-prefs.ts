import { useSyncExternalStore } from "react";

export type WorkSection = "office" | "production";
export const PREFS_SECTION_KEY = "flowsync-user-section";
export const PREFS_NAME_KEY = "flowsync-user-name";

// Keep in sync with OFFICE_USERNAME_KEY for pre-fill compatibility.
const OFFICE_USERNAME_KEY = "flowsync-office-username";

const listeners = new Set<() => void>();

export type UserPrefs = {
  name: string;
  section: WorkSection | null;
};

function read(): UserPrefs {
  if (typeof window === "undefined") return { name: "", section: null };
  const name =
    localStorage.getItem(PREFS_NAME_KEY) ||
    localStorage.getItem(OFFICE_USERNAME_KEY) ||
    "";
  const s = localStorage.getItem(PREFS_SECTION_KEY);
  const section: WorkSection | null =
    s === "office" || s === "production" ? s : null;
  return { name, section };
}

let snapshot: UserPrefs = { name: "", section: null };
let initialized = false;

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  snapshot = read();
}

function refresh() {
  snapshot = read();
  listeners.forEach((l) => l());
}

export function getUserPrefs(): UserPrefs {
  ensureInit();
  return snapshot;
}

export function saveUserPrefs(prefs: { name: string; section: WorkSection }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_NAME_KEY, prefs.name);
  localStorage.setItem(OFFICE_USERNAME_KEY, prefs.name);
  localStorage.setItem(PREFS_SECTION_KEY, prefs.section);
  refresh();
}

export function clearUserPrefs() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFS_NAME_KEY);
  localStorage.removeItem(PREFS_SECTION_KEY);
  refresh();
}

export function hasCompletedWelcome(): boolean {
  const p = getUserPrefs();
  return !!(p.name && p.section);
}

export function useUserPrefs(): UserPrefs {
  return useSyncExternalStore(
    (l) => {
      ensureInit();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => ({ name: "", section: null }),
  );
}