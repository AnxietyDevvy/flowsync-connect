## Site-wide password gate

Add a shared-password gate in front of the entire FlowSync app. One password unlocks the whole site for the current browser session; existing Office/Admin/Dev passwords stay as extra layers on top.

### Behavior
- First visit → `/unlock` page: FlowSync/BPT branding, single password input, "Enter" button.
- Correct password → session cookie set, redirect to originally requested URL (or `/`).
- Wrong password → generic "Incorrect password" message.
- Persistence: session cookie only (cleared when browser closes).
- Locked visitors cannot reach any route (landing, `/office`, `/production`, `/admin`, `/dev`, print routes) or any protected server data.
- `/unlock` itself and `/api/*` public endpoints (if any added later) stay ungated.

### Technical approach (uses the tanstack-shared-password-gate pattern)
- New env vars (server-only, not `VITE_`-prefixed):
  - `SITE_PASSWORD` — I'll ask you to enter it via a secure form (suggested value: `bpt-flowsync`, you can change it).
  - `SESSION_SECRET` — auto-generated 32+ char random string to encrypt the session cookie.
- New files:
  - `src/lib/site-gate.functions.ts` — `unlockSite` (timing-safe compare + set session), `lockSite`, and a `requireUnlocked()` helper. Session cookie `httpOnly`, `secure`, `sameSite=lax`, no `maxAge` → cleared on browser close.
  - `src/routes/unlock.tsx` — password form, calls `unlockSite`, navigates back to intended path.
  - `src/routes/_gated.tsx` — pathless layout with `beforeLoad` that calls a `checkUnlocked` server fn and throws `redirect({ to: '/unlock', search: { redirect: location.href } })` when locked.
- Move existing route files under the `_gated` layout by renaming:
  - `index.tsx` → `_gated.index.tsx`
  - `office.tsx` → `_gated.office.tsx`
  - `production.tsx` → `_gated.production.tsx`
  - `production.print.$id.tsx` → `_gated.production.print.$id.tsx`
  - `admin.tsx` → `_gated.admin.tsx`
  - `dev.tsx` → `_gated.dev.tsx`
  - Route-string constants inside each file updated to include `/_gated/...`.
- No changes to existing Office/Admin/Dev passwords, Supabase schema, or app data.

### Out of scope
- No per-user accounts or activity attribution changes.
- No "remember me for X days" option (session-only per your choice).
- No changes to what happens inside sections once unlocked.

### What I'll need from you during build
- Confirm/enter the site password in the secure secret form when prompted (default suggestion: `bpt-flowsync`).