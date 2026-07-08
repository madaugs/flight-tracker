-- Flight Tracker — Supabase Schema
-- Run this in the Supabase SQL Editor for your project

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  home_airport text default 'ORD',
  display_name text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ── Flights ───────────────────────────────────────────────────────────────────
create table public.flights (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  flight_date date not null,
  origin      text not null,
  destination text not null,
  airline     text,
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index flights_user_id_idx      on public.flights(user_id);
create index flights_user_date_idx    on public.flights(user_id, flight_date);

alter table public.flights enable row level security;
create policy "Users can CRUD own flights" on public.flights for all using (auth.uid() = user_id);

-- ── Trips ─────────────────────────────────────────────────────────────────────
create table public.trips (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  departure_date      date not null,
  return_date         date,
  days_away           int,
  days_away_override  int,
  origin_airport      text not null,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index trips_user_id_idx    on public.trips(user_id);
create index trips_user_dates_idx on public.trips(user_id, departure_date, return_date);

alter table public.trips enable row level security;
create policy "Users can CRUD own trips" on public.trips for all using (auth.uid() = user_id);

-- ── Auto-create profile on signup ────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, home_airport)
  values (new.id, 'ORD')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
