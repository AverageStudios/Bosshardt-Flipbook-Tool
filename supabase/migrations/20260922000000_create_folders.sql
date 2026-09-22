-- Bosshardt Flipbook Tool — folders
--
-- Adds dashboard-only organisation: a flat list of folders, and a nullable
-- reference from each flipbook to one of them.
--
-- Security model is unchanged: like `flipbooks`, the `folders` table is only
-- ever read or written by the Next.js server with the service-role key. RLS is
-- enabled with NO policies and no privileges for anon/authenticated, so the
-- browser's publishable key cannot see or change folders.
--
-- Folders are purely organisational. Public flipbook URLs (/f/[slug]) never
-- include a folder, and deleting a folder never deletes a flipbook: the
-- foreign key is ON DELETE SET NULL, so its flipbooks simply become unfiled.

create extension if not exists "pgcrypto";

create table if not exists public.folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_name_idx on public.folders (lower(name));

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

alter table public.folders enable row level security;

revoke all on table public.folders from anon, authenticated;
grant select, insert, update, delete on table public.folders to service_role;

-- Flipbooks belong to at most one folder. SET NULL keeps the flipbook (and its
-- PDF, thumbnail and share link) when its folder is deleted.
alter table public.flipbooks
  add column if not exists folder_id uuid references public.folders(id) on delete set null;

create index if not exists flipbooks_folder_id_idx on public.flipbooks (folder_id);
