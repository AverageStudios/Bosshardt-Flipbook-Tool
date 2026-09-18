-- Bosshardt Flipbook Tool — schema
--
-- Security model:
--   * All reads/writes of the `flipbooks` table go through the Next.js server
--     using the service-role key. RLS is enabled with NO policies for the
--     `anon` / `authenticated` roles, so the public API key cannot read, list,
--     modify or delete flipbook records.
--   * PDFs and thumbnails live in the public `flipbooks` storage bucket under
--     unguessable UUID folders, so a shared link can load its own PDF without
--     login. There are no storage policies for anon, so nobody can list,
--     upload, overwrite or delete objects with the public key. Uploads use
--     short-lived signed upload URLs issued by the server.

create extension if not exists "pgcrypto";

create table if not exists public.flipbooks (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 200),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  pdf_url       text not null,
  storage_path  text not null,
  page_count    integer not null check (page_count > 0),
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists flipbooks_created_at_idx on public.flipbooks (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists flipbooks_set_updated_at on public.flipbooks;
create trigger flipbooks_set_updated_at
  before update on public.flipbooks
  for each row execute function public.set_updated_at();

alter table public.flipbooks enable row level security;

-- Belt and braces: the public roles get no table privileges at all.
revoke all on table public.flipbooks from anon, authenticated;

-- The server (service role) needs explicit privileges; newer Supabase projects
-- no longer grant them to new tables automatically.
grant select, insert, update, delete on table public.flipbooks to service_role;

-- Storage bucket: public read by URL, 50 MB limit (Free-plan max), PDFs + JPEG thumbnails only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('flipbooks', 'flipbooks', true, 52428800, array['application/pdf', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
