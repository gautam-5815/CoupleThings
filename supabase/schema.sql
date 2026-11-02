-- Couple Things — database schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- The security model, in one line: nothing in this schema is reachable from a
-- browser. Row Level Security is ON and there are deliberately NO policies, so
-- the anon and authenticated roles can read and write nothing at all. Every
-- request goes through this app's own server routes, which hold the service
-- role key and check an owner token before they let anyone change a letter.

create extension if not exists pgcrypto;

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
  -- a published letter is deleted automatically after a year unless the
  -- sender comes back and touches it. Nothing is kept forever by accident.
  expires_at        timestamptz not null default (now() + interval '365 days')
);

create index if not exists letters_expires_at_idx on public.letters (expires_at);

alter table public.letters enable row level security;

-- No policies on purpose. Revoke the default grants as well, so the browser
-- keys cannot touch this table even if a policy is added by mistake later.
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

-- Media (photographs and audio) lives in a PRIVATE bucket. The app hands out
-- short-lived signed URLs when a letter is opened; the files are never public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'letter-media',
  'letter-media',
  false,
  8388608, -- 8 MB per file
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Same rule for the bucket: no browser access, server routes only.
revoke all on storage.objects from anon, authenticated;

-- Optional tidy-up, if you enable pg_cron in your project.
-- select cron.schedule(
--   'couple-things-expire',
--   '0 4 * * *',
--   $$delete from public.letters where expires_at < now()$$
-- );
