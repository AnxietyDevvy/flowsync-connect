## Welcome / preferences screen before section chooser

Add a first-run "Welcome" screen that captures **Name**, **Work section** (Office / Production), and **App theme** (Red / Light / Dark). Once completed, the app skips the "Choose your section" landing and routes the user straight into their section (Office still asks for `bpt-office`).

### Behavior

- On first visit, `/` shows the Welcome form instead of the chooser.
- Fields: Name (text), Work section (Office / Production), Theme (Red / Light / Dark, with visual swatches).
- Persisted in `localStorage` (survives browser close). Keys:
  - `flowsync-user-name` (reuses existing `OFFICE_USERNAME_KEY` so Office gate is pre-filled)
  - `flowsync-user-section` = `"office" | "production"`
  - `flowsync-theme` = `"red" | "light" | "dark"`
- After submit: apply theme, then redirect to `/office` or `/production`.
- On `/` for returning users: auto-redirect to their saved section (no chooser). A small "Change preferences" link on each section header lets them reopen the Welcome screen.
- Sign out on Office still clears the Office password unlock but keeps preferences (so they return to their section, not the chooser).

### Themes

Three variants defined as CSS token sets in `src/styles.css`, toggled by a `data-theme` attribute on `<html>`:

- **Red** (default, current look): black surfaces, red primary accent, grey secondary — as today.
- **Light**: white/near-white surfaces, dark text, muted grey borders, red kept as accent for status/CTAs.
- **Dark**: neutral dark greys (softer than Red), red only on primary buttons/status.

A tiny theme runtime (`src/lib/theme.ts`) reads the saved theme on boot and sets `document.documentElement.dataset.theme` before React mounts to avoid a flash.

### Files

- **New** `src/lib/theme.ts` — `getTheme()`, `setTheme()`, `applyTheme()`, keys, and a `useTheme()` hook via `useSyncExternalStore`.
- **New** `src/lib/user-prefs.ts` — get/set for name + section + `hasCompletedWelcome()`.
- **New** `src/components/flowsync/WelcomeForm.tsx` — the 3-field form with theme swatches.
- **Update** `src/routes/index.tsx` — if prefs missing, render `WelcomeForm`; if present, redirect to saved section. Add a "Change preferences" entry point.
- **Update** `src/routes/__root.tsx` — apply saved theme on mount so it's live app-wide.
- **Update** `src/styles.css` — add `[data-theme="light"]` and `[data-theme="dark"]` token blocks alongside the current `:root` (Red theme). All existing semantic tokens (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--muted`, etc.) get redefined per theme, so components don't need changes.
- **Update** `src/components/flowsync/SectionHeader.tsx` — add a small "Preferences" button and a theme quick-switcher (Red / Light / Dark).
- **Update** `src/routes/office.tsx` — pre-fill the name field from saved prefs; on sign out, keep prefs (only clear the Office password unlock).

### Not changing

- No new tables or auth changes. Preferences are per-device (localStorage), matching the current app model.
- Office password (`bpt-office`) still required to enter Office — the welcome screen only records identity + destination + theme.
- Admin route (`/admin`) is unaffected and still hidden.
