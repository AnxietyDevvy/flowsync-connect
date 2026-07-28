## Change site password to `bptbullets`

The previously generated password isn't working (likely a lockout from failed attempts, or the secret update hasn't propagated to the running server yet). Switching to your chosen value:

1. Update the `SITE_PASSWORD` secret to `bptbullets` via the secure form.
2. Wait for the server to pick up the new env var (may take a moment).
3. If you're still seeing "Too many attempts," clear the site cookie for `office-pro-flow.lovable.app` (or open an incognito window) — the 15-min lockout is stored in your session cookie, not the server.

No code changes needed.