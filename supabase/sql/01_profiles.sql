-- LIA Web - Supabase schema (profiles) + RLS policies
-- Apply this in Supabase SQL Editor (Project -> SQL Editor).

-- Extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  total_xp integer default 0,
  current_streak integer default 0,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS
alter table public.profiles enable row level security;

-- Policies (drop & recreate to keep script re-runnable)
drop policy if exists "Usuários podem ver todos os perfis" on public.profiles;
create policy "Usuários podem ver todos os perfis"
on public.profiles
for select
using (true);

drop policy if exists "Usuários podem editar apenas seu perfil" on public.profiles;
create policy "Usuários podem editar apenas seu perfil"
on public.profiles
for update
using (auth.uid() = id);


