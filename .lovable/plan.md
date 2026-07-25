## Overview
Four connected features:
1. **Product stock levels** that auto-decrement when an order is sent to production
2. **Assign a worker** to each order
3. **Materials per product** (what components/materials are used to make it)
4. **Monthly stock export** to Excel

---

## 1. Product stock levels

### Data
Add to `products` table:
- `stock` (integer, default 0) — current on-hand units of the finished product
- `low_stock` (integer, default 0) — threshold for a "low" badge

### Auto-decrement rule
When an order moves to **sent** status (Office clicks "Send to production"), decrement each product's stock by the ordered quantity. Non-numeric quantities are treated as 0 and skipped safely. Stock can go negative (shown in red) so nothing silently fails — Admin can correct it.

Reverting/deleting a sent order does **not** auto-restore stock (keeps logic simple; Admin can adjust manually).

### UI
- **Products tab (Office):** show current stock next to each product, editable inline, plus a "Low stock" filter
- **Order form:** show available stock beside each catalog item; warn (not block) if requested qty > stock
- **Admin → Products table:** stock + low-stock threshold columns, editable

---

## 2. Assign a worker to an order

### Data
Add to `orders` table:
- `assigned_to` (text, default '') — worker name

### UI
- **Order form (Office):** optional "Assign to" text input (free-form name, same style as the current "created by")
- **Production tab:** show "Assigned: [name]" badge on each incoming order; add an "Assign / reassign" button on production cards so Production can claim or reassign work
- **Admin → Orders table:** assigned worker column, editable

Free-text keeps it consistent with how usernames already work (no accounts).

---

## 3. Materials per product

### Data
Add to `products` table:
- `materials` (jsonb, default `[]`) — array of `{ name: string, quantity: string, unit: string }`

Example: `[{ name: "Kevlar sheet", quantity: "2", unit: "sqm" }, { name: "Ceramic tile", quantity: "6", unit: "pcs" }]`

Kept as free-form entries (not linked to the supplies table) so it's fast to fill in. Can be upgraded later.

### UI
- **Products tab (Office) & Admin:** each product row expands to show a materials editor (add/remove rows with name + qty + unit)
- **Order form:** small "View materials" popover per selected product so Production can see what's needed
- **Print sheet:** optional "Materials required" section per product line

---

## 4. Monthly stock export (Excel)

### Where
- **Admin → Supplies tab:** "Export month" button (primary use case)
- **Office → Supplies tab:** same button (so office can grab it too)

### What's in the file
Single `.xlsx` file, one sheet per month (or a single-sheet snapshot if user picks "current stock only"):

**Sheet: Supplies snapshot**
Columns: Item name · Stock · Reorder level · Status · Notes · Last updated · Noticed by

**Sheet: Products snapshot**
Columns: Product · Category · Stock · Low-stock threshold · Materials (joined text)

**Sheet: Orders this month**
Columns: Order # · Date · Status · Created by · Assigned to · Product · Quantity (one row per product line)

Filename: `flowsync-stock-YYYY-MM.xlsx`

### Implementation
Use the existing `xlsx` package (already installed for imports). New helper `src/lib/stock-export.ts` builds the workbook from the store and triggers a browser download. Month picker defaults to current month.

---

## Technical section

### Migration
Single migration adds columns to existing tables — no new tables, no new policies needed (existing permissive RLS covers new columns).

```
ALTER TABLE products
  ADD COLUMN stock integer NOT NULL DEFAULT 0,
  ADD COLUMN low_stock integer NOT NULL DEFAULT 0,
  ADD COLUMN materials jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE orders
  ADD COLUMN assigned_to text NOT NULL DEFAULT '';
```

### Store changes (`src/lib/flowsync-store.ts`)
- Extend `CatalogProduct` type with `stock`, `lowStock`, `materials`
- Extend `Order` type with `assignedTo`
- `sendOrder(id)` — after status flip, run a batch RPC-free update: fetch product rows by name, compute new stock, update each. Done client-side (small catalog); safe with current permissive RLS.
- New methods: `updateProductStock`, `updateProductMaterials`, `assignOrder`

### Files touched
- Migration (new)
- `src/lib/flowsync-store.ts` — types + methods
- `src/lib/stock-export.ts` — new, workbook builder + download
- `src/components/flowsync/OrderForm.tsx` — assigned-to input, stock display, materials popover
- `src/components/flowsync/ProductsManager.tsx` — stock + materials editor
- `src/components/flowsync/StockExport.tsx` — new, month-picker button + dialog
- `src/routes/office.tsx` — mount StockExport on Supplies tab
- `src/routes/production.tsx` — assigned badge, reassign, StockExport button
- `src/routes/admin.tsx` — new columns in Products/Orders tables

### Types regeneration
Types file updates after the migration is approved, so store code lands after that.

---

Ready to build once you approve. Any tweaks? A few things worth confirming:
- Should sending an order **block** if stock would go negative, or just warn? (Plan: warn only)
- Materials free-form vs linked to Suppliers/Supplies list? (Plan: free-form)
- Assigned worker: free-text like username, or a dropdown of prior names? (Plan: free-text, with autocomplete from prior assignments)
