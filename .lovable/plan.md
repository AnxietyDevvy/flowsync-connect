## Add Suppliers section (Office + Admin)

### New database table
`suppliers` table in Lovable Cloud with:
- name (required)
- email (optional)
- website (optional)
- notes (optional)
- created_by (stamped with the user's name)

Permissive access matching the other tables so realtime sync works everywhere.

### Store updates
Extend `src/lib/flowsync-store.ts`:
- New `Supplier` type + `suppliers` in state
- `refreshSuppliers()` + realtime subscription
- `addSupplier`, `updateSupplier`, `deleteSupplier`

### Office side
- New **Suppliers** tab in `src/routes/office.tsx`
- New `src/components/flowsync/SupplierForm.tsx`: name + email + website + notes, with basic validation (must have at least email OR website, valid email format, URL auto-prefixed with `https://`)
- List of suppliers as cards with clickable email (mailto:) and website (opens in new tab), plus edit/delete
- Stamped with the current office user's name

### Admin side
- New **Suppliers** tab in `src/routes/admin.tsx` data tables area
- Full table view with edit/delete on any row
- Include supplier counts in the Overview stats

### Validation rule
Require at least one contact method (email or website). Email validated with a simple regex; website normalized to include protocol.

No changes to Production side unless you want it there too.