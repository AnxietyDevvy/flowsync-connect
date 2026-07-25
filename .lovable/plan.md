## Manufacturing tab in Production

Add a Manufacturing workflow so Office can send low/out-of-stock supplies to Production to be remade, and Production tracks them in a new tab.

### Data
New table `public.manufacturing_requests`:
- `supply_id`, `supply_name` (snapshot), `notes`
- `status`: `pending` | `in_progress` | `completed`
- `requested_by`, `requested_at`
- `started_by`, `started_at`
- `completed_by`, `completed_at`
- Standard `id`, `created_at`, `updated_at`
- RLS: permissive anon (matches existing tables), added to `supabase_realtime` publication

### Store (`src/lib/flowsync-store.ts`)
- Load + realtime subscribe to `manufacturing_requests`
- Methods: `sendToManufacturing(supply, userName)`, `startManufacturing(id, userName)`, `completeManufacturing(id, userName)`

### Office — Supplies tab
- Each supply row/card gets a **Send to Manufacturing** button next to **Notice** (always available, per your choice)
- Small badge if that supply already has a pending/in-progress request (prevents duplicate spam)

### Production — new **Manufacturing** tab
- Sits alongside Orders and Supplies in `src/routes/production.tsx`
- Three columns/sections: Pending → In Progress → Completed
- Each card shows supply name, notes, who requested it, timestamps
- Actions: **Mark In Progress** (pending → in_progress, stamps worker name), **Mark Complete** (in_progress → completed)

### Admin
- Add manufacturing count to Overview stats
- Add a Manufacturing data table with status editing + delete (matches other admin tables)

### Not included (per your answers)
- No separate section/password — it's a Production tab
- No stock update on complete, no print sheet, no worker assignment field (just who marked in-progress)

### Files
- Migration: create table + grants + RLS + realtime
- `src/lib/flowsync-store.ts` — types, load, realtime, methods
- `src/components/flowsync/ManufacturingPanel.tsx` — Production tab UI
- `src/routes/office.tsx` — add Send button in supplies list
- `src/routes/production.tsx` — add Manufacturing tab
- `src/routes/admin.tsx` — stat + data table
