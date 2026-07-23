## Part 1 — Production orders across devices

Already done. Production reads from the same Cloud-backed store as Office (`useFlowSync` → Supabase `orders` table with realtime). Any order Office sends shows up on every Production device within ~1 second, and status changes (complete) sync back the same way. No changes needed.

## Part 2 — Excel upload for Supplies

Add an "Import Excel" button on the **Supplies** tab (both Office and Production, since both can view supplies today and Production manages them).

### Behavior (sensible defaults since questions were skipped)

- Accepts `.xlsx` and `.csv`.
- Expected columns (case-insensitive, flexible order): **Item name**, **Stock**, **Reorder**, **Notes** (optional). If the header names differ, show a quick column-mapping dropdown before importing.
- **Match by item name** (case-insensitive):
  - Existing item → update `stock`, `reorder`, `notes`.
  - New item → insert it.
  - Items in the app but not in the file → left alone (not deleted).
- **Auto status** from numbers: after each import, `status` is recalculated per row — `out` if stock ≤ 0, `low` if stock ≤ reorder, otherwise `ok`. This is what "automatically tracks the supply level" means in practice: re-upload the sheet (or edit stock in the app) and the low/reorder flags update themselves.
- Preview dialog before committing: shows counts ("12 updated, 3 new, 0 skipped") and any rows with problems (missing name, non-numeric stock) so nothing gets silently mangled.
- Stamps `noticedBy` / an "imported by {name}" note using the Office username when uploaded from Office; Production uploads use "Production".

### Files touched

- **New** `src/lib/supplies-import.ts` — parse xlsx/csv with `xlsx` (SheetJS), normalize headers, compute status, return `{ toInsert, toUpdate, problems }`.
- **New** `src/components/flowsync/SuppliesImport.tsx` — file picker + preview dialog + confirm button. Calls `store.addSupply` / `store.updateSupply` in a batch.
- **Update** `src/lib/flowsync-store.ts` — add `store.upsertSuppliesBulk(rows)` so the import commits in one round-trip instead of N.
- **Update** `src/routes/office.tsx` and `src/routes/production.tsx` — add the "Import Excel" button on the Supplies tab.
- **Add dep** `xlsx` (SheetJS community build) — handles both `.xlsx` and `.csv`.

### Not included (ask if you want them)

- Deleting supplies that are missing from the sheet (destructive; off by default).
- Scheduled/automatic re-imports from a shared drive — this is a manual upload each time.
- History of past imports.
