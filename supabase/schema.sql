-- Couple Things — database schema
--
-- Run this once in your Supabase project: SQL Editor → New query → paste →
-- Run. It should report success; if any statement fails the whole script is
-- rolled back, because the editor runs it as a single transaction.
--
-- This file deliberately does NOT touch the storage schema. Supabase owns it,
-- the SQL editor usually cannot write to it, and one failed statement there
-- would roll back this table as well. The media bucket is created instead by:
--
--     node scripts/setup-storage.mjs
--
-- The security model, in one line: nothing here is reachable from a browser.
-- Row Level Security is on and there are deliberately NO policies, so the anon
-- and authenticated roles can read and write nothing at all. Every request
-- goes through this app's own server routes, which hold the service-role key
-- and check an owner token before they let anyone change a letter.

create table if not exists public.letters (
  id                text        primary key,
  -- sha-256 of the sender's owner token. The token itself is never stored,
  -- so a leaked database still does not let anyone edit a letter.
  owner_token_hash  text        not null,
  -- the letter itself: names, the five pages, the question, media paths.
  payload           jsonb       not null,
  published         boolean     not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- a letter is deleted automatically after a year unless the sender comes
  -- back and touches it. Nothing is kept forever by accident.
  expires_at        timestamptz not null default (now() + interval '365 days')
);

create index if not exists letters_expires_at_idx on public.letters (expires_at);

alter table public.letters enable row level security;

-- No policies, on purpose. Revoke the default grants too, so the browser keys
-- cannot touch this table even if a policy is added by mistake later.
revoke all on public.letters from anon, authenticated;

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists letters_touch_updated_at on public.letters;
create trigger letters_touch_updated_at
  before update on public.letters
  for each row execute function public.touch_updated_at();

-- Make PostgREST notice the new table straight away, rather than waiting for
-- its schema cache to refresh on its own.
notify pgrst, 'reload schema';

-- Optional tidy-up, if you enable pg_cron in your project.
-- select cron.schedule(
--   'couple-things-expire',
--   '0 4 * * *',
--   $$delete from public.letters where expires_at < now()$$
-- );
