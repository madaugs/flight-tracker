# Flight Tracker

A personal travel log: record flights, and see how much of the year you actually
spent away from home.

Flights are the raw input; everything else is derived. Log a departure from your
home airport and a return to it, and that becomes a *trip* — which is what the
days-away figures, the monthly breakdown and the year stats are all built on.

## Features

- **Log flights** — date, route, airline, with airport autocomplete over a
  bundled IATA dataset
- **Trips, derived automatically** — leaving home starts one, returning closes
  it, and connecting flights don't confuse it
- **Year and month stats** — days away, percentage of the year (and of the year
  *so far*, which is the more honest number mid-year), longest trip, airports
  visited, most-flown route
- **Route map** — an orthographic globe with great-circle arcs
- **CSV import** — bulk-load historical flights, with a preview and duplicate
  detection before anything is written
- **Review queue** — flights detected in your inbox wait here for manual
  approval; see [Inbox scanning](#inbox-scanning-optional)
- **Shareable year/month cards** — rendered to an image

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (Postgres + auth) ·
TanStack Query · Recharts · react-simple-maps

## Setup

You'll need your own Supabase project — this app is single-tenant by design and
stores everything in your own database.

**1. Install**

```bash
git clone https://github.com/madaugs/flight-tracker.git
cd flight-tracker
npm install
```

**2. Create a Supabase project** at [supabase.com](https://supabase.com), then
run the SQL in this order from the project's SQL Editor:

1. `supabase-schema.sql` — tables, row-level security, the new-user trigger
2. `supabase/migrations/001_pending_flights.sql`
3. `supabase/migrations/002_generic_home_airport.sql`

**3. Configure**

```bash
cp .env.example .env.local
```

Fill in your project URL and anon key from Supabase → Project Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

The anon key is safe in a browser bundle *because* row-level security is on:
every table restricts rows to `auth.uid()`, so the key alone grants nothing
without a signed-in session. Don't disable RLS.

**4. Run**

```bash
npm run dev
```

Sign in with a magic link, then set your home airport in Settings — trips and
days-away can't be computed without it, so the dashboard will nag you until you
do.

Importing history? `/import` takes a CSV of
`date,origin,destination,airline`.

## Inbox scanning (optional)

Flight confirmations can be pulled out of an email inbox automatically and filed
into the review queue at `/review`, where each one is approved, edited or
rejected by hand. Nothing reaches your flight log without that approval — the
scanner's only write target is the `pending_flights` table, so it structurally
can't add a flight on your behalf.

This matters more than it sounds: airlines send a fresh confirmation email every
time you reschedule, so a naive importer quietly double-books you. Detected
flights are flagged as a likely *change* when they share a confirmation code
with an existing flight, or repeat a route within 10 days — and the review card
offers to replace that flight rather than add a second one.

The scan itself runs outside the app as a scheduled agent, so there's no OAuth
app to register or cron host to run. See [docs/gmail-scan.md](docs/gmail-scan.md)
for how it's wired and the safety properties it relies on.

## Notes

- **Your data stays in your Supabase project.** Nothing is committed to this
  repo, and there's no server component that sees it.
- The bundled `public/airports.json` is a public IATA dataset — no
  network calls are made to resolve airports.
- Trips are recomputed from scratch whenever flights change, so the derived
  numbers can't drift out of sync with the underlying flights.
