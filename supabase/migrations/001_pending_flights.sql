-- Flight Tracker — Gmail ingest staging
-- Adds a review queue so detected reservations never touch `flights`
-- until they've been confirmed by hand.

-- ── Extra identifiers on flights ─────────────────────────────────────────────
-- Carried over from a reservation on approval. confirmation_code is what lets
-- us recognise a rebooking as a *change* to an existing flight rather than a
-- brand-new one.
alter table public.flights add column if not exists flight_number     text;
alter table public.flights add column if not exists confirmation_code text;

create index if not exists flights_user_confirmation_idx
  on public.flights(user_id, confirmation_code)
  where confirmation_code is not null;

-- ── Pending flights (the review queue) ───────────────────────────────────────
create table if not exists public.pending_flights (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,

  -- the parsed reservation
  flight_date        date not null,
  origin             text not null,
  destination        text not null,
  airline            text,
  flight_number      text,
  confirmation_code  text,
  notes              text,

  -- review state
  status             text not null default 'pending'
                       check (status in ('pending', 'approved', 'rejected')),
  flight_id          uuid references public.flights(id) on delete set null,
  reviewed_at        timestamptz,

  -- provenance: where this came from, so a row is always auditable
  source             text not null default 'gmail',
  source_message_id  text,
  source_subject     text,
  source_from        text,
  source_received_at timestamptz,
  confidence         text check (confidence in ('high', 'medium', 'low')),

  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

create index if not exists pending_flights_user_status_idx
  on public.pending_flights(user_id, status, flight_date);

-- One row per leg per source email. Lets the weekly scan re-run safely with
-- `on conflict do nothing` — and means a leg you already rejected stays
-- rejected instead of coming back every week.
create unique index if not exists pending_flights_dedupe_idx
  on public.pending_flights(user_id, source_message_id, flight_date, origin, destination)
  where source_message_id is not null;

alter table public.pending_flights enable row level security;

drop policy if exists "Users can CRUD own pending flights" on public.pending_flights;
create policy "Users can CRUD own pending flights"
  on public.pending_flights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Scan bookkeeping ─────────────────────────────────────────────────────────
-- So the weekly job knows how far back to look.
alter table public.profiles add column if not exists last_gmail_scan_at timestamptz;
