# Company Onboarding Runbook

FlowSync runs as **one separate, private instance per company**. This doc is the
repeatable routine for standing up a new company copy.

## Before you start

- Confirm the company's name and the link they will use.
- Decide its gate password (a new, unique one — do not reuse another company's).
- Each company copy gets its own Lovable Cloud backend. Nothing is shared
  between companies.

## Onboarding steps

1. **Remix the base.** From this project (FlowSync), create a fresh copy via the
   project menu — Right-click the project → **Remix** (or the ⋯ menu → Remix).
   This produces a new project with the full FlowSync codebase.

2. **Give it its own backend.** In the new copy, connect/enable its own Lovable
   Cloud backend. Every company copy is fully isolated at the database level.

3. **Set its gate password.** Create a unique `SITE_PASSWORD` (and keep the
   generated `SESSION_SECRET`) for the new copy so the company gets its own
   entrance secret. Section keys (office / admin / dev) are compiled in and can
   be kept as defaults or changed per copy in `src/lib/flowsync-store.ts`.

4. **Name / branding (optional).** If the company wants its own name or theme,
   adjust the branding. Otherwise it uses the standard FlowSync look.

5. **Publish it.** Publish the new copy so it is live at its own link
   (a `.lovable.app` subdomain or a custom domain the company owns).

6. **Hand over.** Give the company its link and gate password.

7. **Register it.** Open the dev section of any FlowSync instance →
   **Companies** tab → **Add company**, and record the new copy's name and link.
   This lets you jump to every company's dev view from one place (the link opens
   with `/dev` appended).

## Dev access across companies

Every copy ships with the `/dev` section. Because you know the dev key, you can
open any company's link, enter `/dev` and your key, and see that company's
dashboard, data, settings, and danger zone. Your oversight extends to all
copies without any shared database.

## Rolling out an update or fix

- Make the change in one copy (or a scratch copy first).
- Apply the same change to each company copy that should receive it.
- Re-publish each affected copy.

For a small number of companies this is quick. If the number grows large enough
that maintaining copies becomes painful, revisit the multi-tenant (single-app)
design — see the original branching plan for the trade-off.
