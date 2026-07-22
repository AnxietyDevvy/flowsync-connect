## Goal

Two changes:
1. Keep the shared Office password (`bpt-office`) but also ask for a **username** so every action shows who did it.
2. Move Orders, Supplies, and Products from browser localStorage into **Lovable Cloud** so Office and Production see the same live data on every device.

## 1. Username on the Office side

- Update the Office password screen to ask for two fields: **Your name** and **Password**. Both required.
- Store the entered name in `localStorage` on that device (so users don't retype it every visit) — this is just a display label, not authentication.
- Show the current user's name in the Office header with a "Switch user / Sign out of Office" button that clears both the unlock flag and the saved name.
- Stamp `createdBy` on every new order (and on any supply the Office user marks as "noticed") using this name.
- Show "Created by {name}" on order cards, in the order detail dialog, and on the printed sheet (next to "Prepared by").
- Production side stays unchanged (no password, no name prompt) — but they'll see the Office user's name on incoming orders.

## 2. Cloud sync for Orders, Supplies, Products

Enable **Lovable Cloud** and create three tables:

- `orders` — order_number, date, products (jsonb array of `{id, name, quantity}`), notes, status (`draft` | `sent` | `completed`), created_by, created_at, sent_at, completed_at.
- `supplies` — name, stock, reorder, notes, status (`ok` | `low` | `out`), noticed (bool), noticed_by, updated_at.
- `products` — name, category, is_custom (bool). Seeded with the 28 items from the earlier list via a migration.

Because there's no real login (shared password only), all three tables will be readable/writable by `anon` — this matches the current "internal tool, one shared secret" model. This is documented as an accepted risk in security memory.

Rewrite `src/lib/flowsync-store.ts` to:
- Fetch each collection from Supabase on load (via TanStack Query, following the project's loader + `useSuspenseQuery` pattern).
- Subscribe to Postgres Realtime for each table so a change on one device shows up on the other within ~1s.
- Replace every mutation (create order, send, complete, add/update/delete supply, add/delete product, mark supply noticed) with a Supabase call, keeping the existing function signatures so the UI components don't need rewrites beyond passing `createdBy`.
- Drop the old localStorage persistence for these three collections. Keep localStorage only for: Office unlock flag, saved username.

Print route currently reads from the store — it will keep working because the store now hydrates from Cloud on load.

## 3. Files touched

- **New migration**: `orders`, `supplies`, `products` tables + grants + seed for the 28 products.
- **New**: `src/lib/flowsync-api.ts` — thin Supabase read/write/realtime layer.
- **Rewrite**: `src/lib/flowsync-store.ts` — now backed by Cloud instead of localStorage.
- **Update**: `src/routes/office.tsx` — password screen adds a name field; header shows name + switch-user; passes `createdBy` when creating orders and marking supplies noticed.
- **Update**: `src/components/flowsync/OrderForm.tsx` — accepts `createdBy` prop.
- **Update**: `src/components/flowsync/PrintSheet.tsx` and `src/components/flowsync/SectionHeader.tsx` — show "Prepared by {name}" / current user chip.
- **Update**: `src/routes/production.tsx` — display "From: {name}" on incoming order cards.

## What this is NOT

- Not real per-user accounts. Anyone with the shared password can type any name. If two people want tighter control (audit trail, revoke individual access, password reset), that's the "Real user accounts" option and I can add it later.
- Not role-based access on the DB — the shared-password gate stays purely client-side; the security guarantee is the same as today.
