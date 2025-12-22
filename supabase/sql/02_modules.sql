-- LIA Web - Supabase schema (modules) + RLS policies
-- Apply this in Supabase SQL Editor (Project -> SQL Editor).

-- Extensions (if not already created)
create extension if not exists "uuid-ossp";

-- Modules table
create table if not exists public.modules (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  description text,
  difficulty_level text check (difficulty_level in ('iniciante', 'intermediario', 'avancado')),
  order_index integer unique not null,
  icon_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes for performance
create index if not exists idx_modules_order_index on public.modules(order_index);
create index if not exists idx_modules_difficulty_level on public.modules(difficulty_level);
create index if not exists idx_modules_slug on public.modules(slug);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger handle_modules_updated_at
  before update on public.modules
  for each row execute procedure public.handle_updated_at();

-- RLS (Row Level Security)
alter table public.modules enable row level security;

-- Policies (drop & recreate to keep script re-runnable)
drop policy if exists "Usuários podem ler todos os módulos" on public.modules;
create policy "Usuários podem ler todos os módulos"
on public.modules
for select
using (true);

-- Insert initial data
insert into public.modules (slug, title, description, difficulty_level, order_index, icon_url)
values
  ('alfabeto', 'Alfabeto', 'Aprenda as letras do alfabeto em Libras', 'iniciante', 1, '/icons/alfabeto.svg'),
  ('numeros', 'Números', 'Aprenda os números em Libras', 'iniciante', 2, '/icons/numeros.svg'),
  ('saudacoes', 'Saudações', 'Expressões de saudação em Libras', 'intermediario', 3, '/icons/saudacoes.svg')
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  difficulty_level = excluded.difficulty_level,
  order_index = excluded.order_index,
  icon_url = excluded.icon_url,
  updated_at = timezone('utc'::text, now());

-- Verify data was inserted
select 'Modules created successfully' as status, count(*) as total_modules from public.modules;
