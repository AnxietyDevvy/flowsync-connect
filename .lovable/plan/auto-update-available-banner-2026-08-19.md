# Auto "Update available" banner

## Goal
When a new version of FlowSync is published, anyone with the app open (or installed on their phone) sees a small banner offering to update. One tap installs the new version, re-syncs data from the backend, and reloads.

## What the user sees
- A slim bar pinned to the bottom of the screen: "A new version of FlowSync is available" with an **Update now** button and a dismiss (X).
- Pressing **Update now** shows "Updating…", then the app reloads on the new version with fresh data.
- Dismissing hides it until the next new version (or next reload).
- The banner only appears when there is genuinely something new — it stays out of the way the rest of the time.

## Behaviour
1. The service worker (already in the app for offline support) detects a newer published build and signals "needs refresh".
2. The banner appears in every section (Office, Production, Admin, Dev) since it lives at the app root.
3. On **Update now**:
   - flush any queued offline changes so nothing is lost,
   - activate the new version of the app,
   - clear the cached app shell/data so nothing stale survives,
   - re-pull orders, supplies, products, suppliers, manufacturing requests, settings and profiles from the backend,
   - reload the page.
4. A periodic check (every ~15 minutes and whenever the tab regains focus) asks the service worker to look for a new version, so long-running screens on the shop floor notice updates without a manual reload.

## Notes / limits
- The service worker is intentionally disabled inside the Lovable editor preview, so the banner won't show there — it works on the published site and installed phone app. For testing, a hidden manual "Check for updates" control will be added in the /dev section that forces the check and hard-refreshes.
- Offline queued changes are flushed before reload so no order or supply edit is dropped.

## Technical outline
- New `src/components/flowsync/UpdateBanner.tsx`: subscribes to update state, renders the bar, handles the update action.
- New `src/pwa/update-state.ts`: tiny store wrapping `virtual:pwa-register`'s `registerSW({ onNeedRefresh, onRegisteredSW })`, exposing `needsRefresh`, `updateApp()`, `checkForUpdate()`. `registerAppSW()` in `src/pwa/register-sw.ts` is refactored to store the returned `updateSW` function instead of discarding it; all existing preview/iframe/dev guards stay unchanged.
- `registerSW` periodic update: use `onRegisteredSW` to `setInterval(r.update, 15 min)` plus a `visibilitychange` listener.
- Update action: `await flush()` (from `src/lib/offline/outbox.ts`) → `updateSW(true)` → clear Cache Storage entries for this app → `window.location.reload()`; the store's existing `loadAll()` runs on boot so data re-pulls automatically.
- `UpdateBanner` is rendered once in `src/routes/__root.tsx` next to the existing providers, so it covers every route.
- Dev section: add a "Check for updates" button in `src/routes/_gated.dev.tsx` calling `checkForUpdate()` and, when no SW is present (preview), a plain hard reload.
