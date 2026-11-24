-- Garden AI backend foundation: run this migration in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Mi jardín',
  status text not null default 'draft' check (status in ('draft','analyzing','designed','error')),
  width_m numeric,
  length_m numeric,
  conditions jsonb not null default '{}'::jsonb,
  original_photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'pending' check (status in ('pending','completed','failed')),
  render_path text,
  plan_data jsonb not null default '{}'::jsonb,
  plant_recommendations jsonb not null default '[]'::jsonb,
  budget_estimate jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(project_id, version)
);

create table if not exists public.design_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  image_analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);
create index if not exists designs_project_version_idx on public.designs(project_id, version desc);
create index if not exists analyses_project_created_idx on public.design_analyses(project_id, created_at desc);

alter table public.projects enable row level security;
alter table public.designs enable row level security;
alter table public.design_analyses enable row level security;

drop policy if exists "Users manage own projects" on public.projects;
create policy "Users manage own projects" on public.projects
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own designs" on public.designs;
create policy "Users manage own designs" on public.designs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own analyses" on public.design_analyses;
create policy "Users manage own analyses" on public.design_analyses
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('garden-photos','garden-photos',false,10485760,array['image/jpeg','image/png','image/webp']),
  ('garden-renders','garden-renders',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Users upload own garden files" on storage.objects;
create policy "Users upload own garden files" on storage.objects
for insert to authenticated with check (bucket_id in ('garden-photos','garden-renders') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users view own garden files" on storage.objects;
create policy "Users view own garden files" on storage.objects
for select to authenticated using (bucket_id in ('garden-photos','garden-renders') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own garden files" on storage.objects;
create policy "Users update own garden files" on storage.objects
for update to authenticated using (bucket_id in ('garden-photos','garden-renders') and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id in ('garden-photos','garden-renders') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own garden files" on storage.objects;
create policy "Users delete own garden files" on storage.objects
for delete to authenticated using (bucket_id in ('garden-photos','garden-renders') and (storage.foldername(name))[1] = auth.uid()::text);
