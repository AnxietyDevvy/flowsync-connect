## Hidden admin section

Add a hidden `/admin` route protected by password `bpt-admin` that shows a full dashboard of the app's data.

### Access
- URL: `/admin` (not linked anywhere in the UI — accessed only by typing the URL directly)
- Password gate identical in style to the Office gate; unlock stored in `sessionStorage` (`ADMIN_UNLOCK_KEY`) so it persists during the session but clears on browser close
- Sign-out button in the header returns to landing

### Dashboard sections (tabbed)

**1. Overview**
- Order counts: total, draft, sent, completed
- Supply counts by status: OK, low, out
- Product count (with breakdown by category, including custom vs seeded)
- Recent activity feed: latest 10 orders + supply changes, newest first

**2. Data tables** (full CRUD across everything)
- **Orders** — full list with status, order #, date, created by, product count, notes. Actions: view details (expand), delete, force-change status (draft/sent/completed)
- **Supplies** — full list with stock, reorder, status, noticed-by. Actions: edit, delete
- **Products** — full catalog. Actions: delete (including seeded ones, since admin overrides Office's custom-only restriction)

**3. Activity log**
- Chronological list derived from `createdBy` / `noticedBy` / `sentAt` / `completedAt` stamps across orders and supplies
- Grouped by user name, with counts (e.g. "Sarah — 12 orders created, 3 supplies noticed")
- Filterable by user name

### Files

- **New** `src/routes/admin.tsx` — password gate + tabbed dashboard (Overview / Data / Activity). Reuses `useFlowSync` store hooks so it's live-synced with Cloud data.
- **New** `src/components/flowsync/admin/AdminOverview.tsx` — stat cards + recent activity
- **New** `src/components/flowsync/admin/AdminDataTables.tsx` — three tables with inline actions
- **New** `src/components/flowsync/admin/AdminActivityLog.tsx` — user activity aggregation
- **Update** `src/lib/flowsync-store.ts` — add `store.updateOrderStatus(id, status)` and `store.deleteSupply(id)` / `store.deleteProduct(id)` if not already present (admin needs unrestricted delete)
- **Update** `src/components/flowsync/SectionHeader.tsx` — accept an `"ADMIN"` label variant (uses same red chip)

### Security notes
- Client-side password check only (per your choice). The password lives in the JS bundle — anyone who inspects the source can find it. That's the same trade-off as the Office gate.
- No changes to Supabase RLS — admin uses the same anon-accessible policies the rest of the app uses.
- Route is not linked from anywhere (landing, headers, nav). Only reachable by typing `/admin`.
