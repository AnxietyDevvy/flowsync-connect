## Goal

Keep the current shared-password gate as the access model, but make the site meaningfully "company-only" by removing the ways an outsider could stumble on the URL or brute-force the password.

## Changes

1. **Rotate the site password** to a stronger, company-only value
   - Update the `SITE_PASSWORD` secret to something non-guessable (not `bpt-flowsync`, which has appeared in chat and is easy to guess).
   - You share the new password with staff directly (chat/email/notice board) — not through the app.
   - Suggested: something like `Bpt-Flow-2026-Sync!` or a value you provide. I'll ask for the exact value before rotating.

2. **Hide the site from search engines**
   - Add `robots.txt` disallowing all crawlers.
   - Add `<meta name="robots" content="noindex, nofollow">` in the root head.
   - Effect: the URL won't show up in Google/Bing results, so people can only reach it if you give them the link.

3. **Hide the "Edit with Lovable" badge** on the published site
   - Removes the visible Lovable branding that hints this is a Lovable-hosted app.
   - Requires Pro plan or higher (you may already have this — I'll check).

4. **Small gate hardening**
   - Add a short throttle on `/unlock` so someone can't script thousands of password guesses (e.g. 5 attempts / 15 min per session cookie, with a friendly "try again shortly" message).
   - Keep the existing timing-safe compare and encrypted session cookie.

## What this does and doesn't give you

- **Does**: URL is unlisted, badge is gone, password is strong and only your team knows it, guessing is slow.
- **Doesn't**: There are still no individual accounts — anyone who has the password can enter, and you can't revoke one person without rotating the password for everyone. If you later want per-person access (with the ability to remove one user), the right move is switching to email-allowlist login. Not doing that now.

## Files touched

- `public/robots.txt` (new)
- `src/routes/__root.tsx` — add noindex meta
- `src/lib/site-gate.functions.ts` — add per-session attempt throttle
- Secret rotation via tooling (no code change)
- Badge visibility via tooling (no code change)

## What I need from you before building

- The new site password value (or say "generate one and show it to me once").
