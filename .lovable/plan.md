## Profile customization (synced, no login)

Add a synced profile per person: **display name, role/title, avatar** (color-tinted initials badge or uploaded image). Profile shows in the header, on order cards ("created by"), supply notices, and manufacturing requests. No real login — the typed name is still the identity, but the profile record lives in the cloud so the same avatar/role follows the user across devices.

### Data
New `profiles` table in Lovable Cloud, keyed by lowercased name:
- `name_key` (PK, text) — lowercase trimmed name
- `display_name` (text) — cased version
- `role` (text) — e.g. "Office Lead"
- `avatar_color` (text) — one of ~8 preset tokens (red/amber/emerald/…)
- `avatar_url` (text, nullable) — for uploaded images
- standard timestamps
- RLS: `authenticated` full access (matches existing tables)

New `avatars` public storage bucket for uploaded images (2MB cap, image/*).

### UI
- **Header** — replace the plain name chip with an avatar + name button; clicking opens the profile editor.
- **Profile editor dialog** — edit display name, role, pick a color OR upload an image, live preview. "Save" upserts profile in the store.
- **Welcome screen** — after typing a name, if no profile exists it prompts for role + avatar as step 2 (skippable, defaults to initials + auto-picked color).
- **Everywhere a name appears** (order cards, supply notices, manufacturing panels, print sheet "prepared by") — render a small `<PersonBadge>` = avatar + name + optional role.

### Sync
`flowsync-store` gains `profiles` state, realtime subscription, offline cache, and outbox-backed `upsertProfile`/`setAvatarUrl` mutations, matching the existing offline-first pattern.

### Files
- New migration: `profiles` table + `avatars` bucket + RLS/grants.
- New `src/components/flowsync/PersonBadge.tsx` — avatar+name display.
- New `src/components/flowsync/ProfileEditor.tsx` — dialog form.
- Update `src/lib/flowsync-store.ts` — profile types, load/refresh/realtime, cache, mutations.
- Update `src/components/flowsync/SectionHeader.tsx` — avatar button opens editor.
- Update `src/components/flowsync/WelcomeForm.tsx` — optional profile step.
- Update order/supply/manufacturing renderers in `_gated.office.tsx`, `_gated.production.tsx`, `ManufacturingPanel.tsx`, `PrintSheet.tsx`, and `_gated.admin.tsx` to use `<PersonBadge>`.

### Not included
No real per-user login, no permissions/roles enforcement — role is display-only. Profiles are keyed by name, so two people typing the same name share one profile (matches today's behavior).
