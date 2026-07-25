## Hidden `/dev` section (just for you)

A new hidden route at `/dev`, protected by a password prompt (same pattern as `/admin`). Not linked anywhere in the UI — you just type the URL. Kept fully separate from `/admin`, which stays as-is for shared office use.

### Password
- `bpt-dev` (hardcoded like the Office/Admin passwords). Say the word if you'd like a different one.
- Session unlock stored in `sessionStorage` (auto-locks when the browser closes), same as Office/Admin.

### What's inside — three tabs

**1. Dashboard (everything Admin has)**
- Overview stats: orders, supplies, products, suppliers, manufacturing counts
- Full data tables for orders, supplies, products, suppliers, manufacturing (status edit + delete)
- User activity log
- Basically a copy of the current `/admin` content so you have it in one place without cross-navigation

**2. Danger zone**
- Wipe all draft orders
- Wipe all completed orders
- Wipe all completed manufacturing requests
- Reset a table (Orders / Supplies / Products / Suppliers / Manufacturing) — hard delete every row
- Export full database snapshot as a single JSON file (all tables)
- Import snapshot back (restores all tables from a JSON file — with a scary confirm)
- Every destructive action requires typing the table name (or `WIPE`) to confirm

**3. App settings**
- Edit the Office password, Admin password, and Dev password (stored in a new `app_settings` key/value table so changes stick across devices)
- Seed default product catalog (re-inserts the original 28 ballistic products if missing)
- Toggle feature flags: show/hide Manufacturing tab, show/hide Suppliers tab, allow Office to send-to-manufacturing (stored in `app_settings` and read by the store)

### Technical section

- **Route**: `src/routes/dev.tsx` — gate + tabbed layout, mirrors `admin.tsx` structure. Password check client-side, same as `/admin`.
- **Store additions** (`src/lib/flowsync-store.ts`):
  - `wipeOrdersByStatus(status)`, `wipeCompletedManufacturing()`, `resetTable(tableName)` — batch deletes via Supabase
  - `exportSnapshot()` → downloads `flowsync-snapshot-<date>.json` containing all rows from all tables
  - `importSnapshot(json)` → truncates + re-inserts each table
  - `getAppSetting(key)` / `setAppSetting(key, value)` + realtime subscription so passwords/flags update live
- **New table** `public.app_settings` (`key text primary key`, `value jsonb`, `updated_at`) with permissive anon RLS to match existing tables. Grants for anon + authenticated + service_role. Seeded with defaults for the three passwords and feature flags.
- **Password source of truth**: `OFFICE_PASSWORD`, `ADMIN_PASSWORD`, `DEV_PASSWORD` in the store become fallbacks; the gates read the current values from `app_settings` first, then fall back to hardcoded defaults. This means changing a password in `/dev` propagates to everyone without a code change.
- **Feature flags**: read once at Office/Production render time from `app_settings`; realtime sync updates the UI when you toggle them from `/dev`.
- **No changes** to `/admin`, `/office`, `/production`, `/` — pure addition.

### Files touched
- `src/routes/dev.tsx` — new
- `src/components/flowsync/DevDashboard.tsx`, `DevDangerZone.tsx`, `DevSettings.tsx` — new
- `src/lib/flowsync-store.ts` — new methods + settings hook
- `src/routes/office.tsx`, `src/routes/production.tsx` — read feature flags to hide/show tabs
- Migration for `app_settings` table

### Not included
- No real login / accounts (per your choice of "Hidden URL + password")
- Not linked from any menu — you access it only by typing `/dev`
- `/admin` stays untouched
