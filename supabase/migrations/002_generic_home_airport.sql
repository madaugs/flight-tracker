-- Drop the baked-in 'ORD' home-airport default.
--
-- A default home airport is wrong for anyone but the original author: it makes
-- a fresh account silently compute trips against an airport they've never flown
-- from. Home airport is now unset until the user picks one, and the dashboard
-- prompts for it.
--
-- Existing profiles keep whatever they already have.

alter table public.profiles alter column home_airport drop default;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
