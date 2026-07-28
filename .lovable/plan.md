## Offline + Installable FlowSync

Make FlowSync work fully offline on Office and Production devices, installable to home screen / desktop, with all changes queued locally and synced automatically when the connection returns.

### How it will behave

- Open the app with no internet: app shell loads instantly from cache, last-synced data (orders, supplies, products, suppliers, manufacturing requests) is visible.
- Create orders, edit stock, notice supplies, send-to-manufacturing, add suppliers, etc. while offline: changes apply instantly to the local view and go into a pending outbox.
- Back online: the outbox flushes automatically, realtime resumes, a small "Syncing… / All synced" indicator in the header shows status and pending count.
- Install: Add-to-Home-Screen on iPad/Android/desktop with the FlowSync logo, standalone window, splash colors matching the current theme.
- Site password unlock (`/unlock`) still requires being online once per browser session — after that everything works offline until the browser closes (session cookie already scoped that way).

### Conflict handling

Simple last-write-wins per record, based on `updated_at`. Two people editing the same supply offline: whoever syncs last wins. For orders this is safe because each order is authored by one person; for supplies it matches how the team already works. Stock decrement on "send order" is queued as a delta so two offline sends both apply.

### Files to add / change

New:
- `vite-plugin-pwa` config in `vite.config.ts` (generateSW, `registerType: "autoUpdate"`, NetworkFirst navigations, `/~oauth` and `/api/**` excluded), `devOptions.enabled: false`, `injectRegister: null`.
- `public/manifest.webmanifest` + icons (192, 512, maskable, apple-touch) generated from the FlowSync logo.
- `src/pwa/register-sw.ts` — guarded registration wrapper (skips preview/iframe/dev/`?sw=off`, unregisters stale SWs there).
- `src/lib/offline/db.ts` — IndexedDB (via `idb`) with stores: `orders`, `supplies`, `products`, `suppliers`, `manufacturing_requests`, `outbox`, `meta`.
- `src/lib/offline/sync.ts` — bootstrap from cache first, then network; realtime subscription on reconnect; outbox flusher with retry/backoff.
- `src/components/flowsync/SyncStatus.tsx` — header chip: Online / Offline / Syncing (n pending).
- `src/hooks/use-online.ts` — `navigator.onLine` + `online`/`offline` events.

Changed:
- `src/lib/flowsync-store.ts` — every mutation writes to IndexedDB + outbox first, updates in-memory state immediately, then tries the network. Bootstrap reads IndexedDB first, then reconciles from Supabase. Realtime updates merge into IndexedDB.
- `src/routes/__root.tsx` — call the guarded SW registration on mount; add manifest/theme-color/apple-touch link tags.
- `src/components/flowsync/SectionHeader.tsx` — mount `<SyncStatus />`.
- `src/routes/unlock.tsx` — friendly message when offline and no session cookie ("Connect to the internet once to unlock").

No schema changes. No changes to the site-gate server functions.

### Security finding: `SUPA_auth_allow_anonymous_sign_ins` on `suppliers`

This is expected for FlowSync's design: the app has no per-user login, uses one shared site password, and signs every visitor in anonymously so RLS-protected tables (`suppliers`, `app_settings`) require an `authenticated` JWT instead of raw `anon`. That's the same accepted posture from the previous security pass. I'll mark this finding as ignored with that explanation via `manage_security_finding` and refresh the security memory — no schema change.

### Out of scope

- Per-user accounts, per-device conflict UI, or manual merge tools.
- Offline Excel import (still needs to be online — file parsing is local, but writing to Cloud goes through the same outbox).
- Offline printing already works (browser handles it).
