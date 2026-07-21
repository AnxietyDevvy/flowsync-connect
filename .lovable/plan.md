## Goal

Replace the free-text product entry in the Office order form with a searchable catalog seeded from your list, and let Office manage that catalog (add / remove custom products) directly in-app.

## Product catalog

Seed the catalog into three natural categories based on your list:

- **ICW / SA Plates** — ICW1–ICW6, SA1–SA9
- **Vehicle Armor** — ARAMID B4, UHMWPE B4/B6 (×3), Vikashield Glass Reinforced Matrix
- **Military Vehicle Armor** — STANAG Level 2 / 3(-) / 3 Full / 4, Vikashield, Aramid, UHMWPE
- **Ballistic Shield** — Level IIIA Shield

Each product stores: name, category, and an `isCustom` flag (so seeded items can't be accidentally deleted while user-added ones can).

## Order form changes

Rework `OrderForm.tsx`:

- Replace the free-typed "Products" textarea with a **searchable, category-grouped picker**: type to filter, click to add, set quantity inline; added lines show name + quantity with a remove button.
- Keep Order number, Date, and Notes as they are.
- The order payload keeps the same shape (products list with names + quantities) so Production, print sheet, and existing saved orders keep working.

## Manage-products UI (Office only)

Add a "Products" tab to the Office section alongside Orders and Supplies:

- List all catalog items grouped by category with a search box.
- "Add product" form: name + category selector (existing categories + "New category" option).
- Remove button on user-added items only; seeded items are locked (with a small "preset" tag) to protect the base list.

## Storage

Extend `src/lib/flowsync-store.ts` with a `products` collection persisted in localStorage alongside orders and supplies. On first load, seed with the list above if the store is empty; later additions/removals persist per browser like the rest of FlowSync data.

## Out of scope

- Production side stays read-only for the catalog (they receive orders as before).
- No SKU/code field — just name + category, matching what you sent. Easy to add later if you want.
