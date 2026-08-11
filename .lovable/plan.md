# Plan: Opening FlowSync to Multiple Companies

## The two ways to "branch out"

There are two fundamentally different shapes this can take. Your answers
(per-company link, complete isolation, dev section everywhere) point strongly
to one of them.

### Option A — One separate instance per company (recommended)

Each company runs its own **copy** of FlowSync, hosted at its own web link,
with its own private data and its own gate password.

- How a company gets started: I "remix" this project into a fresh copy, give
  it its own backend and its own password, and publish it to its own link.
  The company then uses it exactly the way BPT uses FlowSync today.
- Isolation: each company has a physically separate database. There is no way
  for one company to see another's orders, supplies, or products — they are
  different apps.
- Dev section: the `/dev` route is part of every copy, so you can open any
  company's link, enter your dev password, and see that company's dashboard.
- Per-company link: each company gets its own URL (e.g. `acme.lovable.app` or
  their own domain) that loads only their workspace.
- The real cost: updates and bug fixes have to be rolled out to each copy.
  For a handful of companies this is quick. For dozens it becomes tedious.

### Option B — One app, many companies (multi-tenant)

One app and one backend, but every record is tagged with a company, and each
company can only ever see its own data.

- Per-company link is awkward here: Lovable hosting serves one app at one
  origin, so "links" become paths (`your-app.lovable.app/acme`) rather than
  true separate websites.
- Isolation has to be enforced in the database, row by row. FlowSync
  currently uses anonymous access (no real user accounts), which makes
  strict per-company isolation genuinely hard to build safely.
- Best when you expect many companies and can accept the complexity.

## Recommendation

**Option A.** It matches every preference you gave: each company gets its own
link, data is fully sealed off, and the dev section exists in every copy so
you keep oversight of all of them. It also needs no change to how FlowSync
works today — each company is just a fresh, private instance.

The one thing to accept is that updates must be applied to each company copy.
For a small number of companies this is a quick, repeatable routine.

## What building this turn means

There is no code rewrite — Option A is mostly a repeatable setup routine.
This turn would deliver:

1. A clean "base" version of FlowSync (this project, minus any per-company
   test data) that acts as the template for new copies.
2. A written onboarding runbook I follow each time a company signs on:
   - Remix the base into a fresh project.
   - Give it its own private backend and its own gate password.
   - Set its name/branding if different.
   - Publish it to its own link.
   - Hand the link + password to that company; add its link to the dev
     section so you can jump to any company from one place.
3. A small addition to the dev section: a "Companies" page listing every
   active company copy with a one-click link to open each one's dev view.

## Technical notes

- Each company copy has its own Lovable Cloud (Supabase) backend. No shared
  tables, no shared sessions — full isolation by construction.
- The site-wide gate, office/production/admin/dev passwords are all stored
  per-copy as secrets, so each company's credentials are unique.
- Adding a company is purely operational (remix + configure + publish). No
  schema or RLS changes are needed for Option A.

## What I'd confirm with you before starting

- Roughly how many companies do you expect? (1–2 makes Option A trivial; a
  large pipeline may eventually justify Option B.)
- Do you want this first "branch-out" to actually create a second live
  company copy now, or just set up the base template + runbook for when the
  next company is ready?
