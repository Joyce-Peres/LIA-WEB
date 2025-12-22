-- LIA Web - Supabase schema (lessons) + RLS policies
-- Apply this in Supabase SQL Editor (Project -> SQL Editor).
-- Run this AFTER 02_modules.sql

-- Lessons table
create table if not exists public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid not null references public.modules(id) on delete cascade,
  gesture_name text not null,
  display_name text not null,
  video_ref_url text,
  min_confidence_threshold decimal(3,2) default 0.70 check (min_confidence_threshold >= 0 and min_confidence_threshold <= 1),
  xp_reward integer default 10 check (xp_reward >= 0),
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),

  -- Unique constraint per module
  unique(module_id, gesture_name)
);

-- Indexes for performance
create index if not exists idx_lessons_module_id on public.lessons(module_id);
create index if not exists idx_lessons_module_order on public.lessons(module_id, order_index);
create index if not exists idx_lessons_gesture_name on public.lessons(gesture_name);

-- Trigger to automatically update updated_at
create trigger handle_lessons_updated_at
  before update on public.lessons
  for each row execute procedure public.handle_updated_at();

-- RLS (Row Level Security)
alter table public.lessons enable row level security;

-- Policies (drop & recreate to keep script re-runnable)
drop policy if exists "Usuários podem ler todas as lições" on public.lessons;
create policy "Usuários podem ler todas as lições"
on public.lessons
for select
using (true);

-- Insert initial lessons data for Alfabeto module
insert into public.lessons (module_id, gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
select
  m.id as module_id,
  lesson_data.gesture_name,
  lesson_data.display_name,
  lesson_data.video_ref_url,
  lesson_data.min_confidence_threshold,
  lesson_data.xp_reward,
  lesson_data.order_index
from public.modules m
cross join (values
  ('A', 'Letra A', '/videos/letra-a.mp4', 0.75, 10, 1),
  ('B', 'Letra B', '/videos/letra-b.mp4', 0.75, 10, 2),
  ('C', 'Letra C', '/videos/letra-c.mp4', 0.75, 10, 3),
  ('D', 'Letra D', '/videos/letra-d.mp4', 0.75, 10, 4),
  ('E', 'Letra E', '/videos/letra-e.mp4', 0.75, 10, 5),
  ('F', 'Letra F', '/videos/letra-f.mp4', 0.75, 10, 6),
  ('G', 'Letra G', '/videos/letra-g.mp4', 0.75, 10, 7),
  ('H', 'Letra H', '/videos/letra-h.mp4', 0.75, 10, 8),
  ('I', 'Letra I', '/videos/letra-i.mp4', 0.75, 10, 9),
  ('J', 'Letra J', '/videos/letra-j.mp4', 0.75, 10, 10),
  ('K', 'Letra K', '/videos/letra-k.mp4', 0.75, 10, 11),
  ('L', 'Letra L', '/videos/letra-l.mp4', 0.75, 10, 12),
  ('M', 'Letra M', '/videos/letra-m.mp4', 0.75, 10, 13),
  ('N', 'Letra N', '/videos/letra-n.mp4', 0.75, 10, 14),
  ('O', 'Letra O', '/videos/letra-o.mp4', 0.75, 10, 15),
  ('P', 'Letra P', '/videos/letra-p.mp4', 0.75, 10, 16),
  ('Q', 'Letra Q', '/videos/letra-q.mp4', 0.75, 10, 17),
  ('R', 'Letra R', '/videos/letra-r.mp4', 0.75, 10, 18),
  ('S', 'Letra S', '/videos/letra-s.mp4', 0.75, 10, 19),
  ('T', 'Letra T', '/videos/letra-t.mp4', 0.75, 10, 20),
  ('U', 'Letra U', '/videos/letra-u.mp4', 0.75, 10, 21),
  ('V', 'Letra V', '/videos/letra-v.mp4', 0.75, 10, 22),
  ('W', 'Letra W', '/videos/letra-w.mp4', 0.75, 10, 23),
  ('X', 'Letra X', '/videos/letra-x.mp4', 0.75, 10, 24),
  ('Y', 'Letra Y', '/videos/letra-y.mp4', 0.75, 10, 25),
  ('Z', 'Letra Z', '/videos/letra-z.mp4', 0.75, 10, 26)
) as lesson_data(gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
where m.slug = 'alfabeto'
on conflict (module_id, gesture_name) do update set
  display_name = excluded.display_name,
  video_ref_url = excluded.video_ref_url,
  min_confidence_threshold = excluded.min_confidence_threshold,
  xp_reward = excluded.xp_reward,
  order_index = excluded.order_index,
  updated_at = timezone('utc'::text, now());

-- Insert initial lessons data for Números module
insert into public.lessons (module_id, gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
select
  m.id as module_id,
  lesson_data.gesture_name,
  lesson_data.display_name,
  lesson_data.video_ref_url,
  lesson_data.min_confidence_threshold,
  lesson_data.xp_reward,
  lesson_data.order_index
from public.modules m
cross join (values
  ('1', 'Número 1', '/videos/numero-1.mp4', 0.75, 10, 1),
  ('2', 'Número 2', '/videos/numero-2.mp4', 0.75, 10, 2),
  ('3', 'Número 3', '/videos/numero-3.mp4', 0.75, 10, 3),
  ('4', 'Número 4', '/videos/numero-4.mp4', 0.75, 10, 4),
  ('5', 'Número 5', '/videos/numero-5.mp4', 0.75, 10, 5),
  ('6', 'Número 6', '/videos/numero-6.mp4', 0.75, 10, 6),
  ('7', 'Número 7', '/videos/numero-7.mp4', 0.75, 10, 7),
  ('8', 'Número 8', '/videos/numero-8.mp4', 0.75, 10, 8),
  ('9', 'Número 9', '/videos/numero-9.mp4', 0.75, 10, 9),
  ('10', 'Número 10', '/videos/numero-10.mp4', 0.75, 10, 10)
) as lesson_data(gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
where m.slug = 'numeros'
on conflict (module_id, gesture_name) do update set
  display_name = excluded.display_name,
  video_ref_url = excluded.video_ref_url,
  min_confidence_threshold = excluded.min_confidence_threshold,
  xp_reward = excluded.xp_reward,
  order_index = excluded.order_index,
  updated_at = timezone('utc'::text, now());

-- Insert initial lessons data for Saudações module
insert into public.lessons (module_id, gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
select
  m.id as module_id,
  lesson_data.gesture_name,
  lesson_data.display_name,
  lesson_data.video_ref_url,
  lesson_data.min_confidence_threshold,
  lesson_data.xp_reward,
  lesson_data.order_index
from public.modules m
cross join (values
  ('OLA', 'Olá', '/videos/ola.mp4', 0.80, 15, 1),
  ('BOM_DIA', 'Bom dia', '/videos/bom-dia.mp4', 0.80, 15, 2),
  ('BOA_TARDE', 'Boa tarde', '/videos/boa-tarde.mp4', 0.80, 15, 3),
  ('BOA_NOITE', 'Boa noite', '/videos/boa-noite.mp4', 0.80, 15, 4),
  ('TCHAU', 'Tchau', '/videos/tchau.mp4', 0.80, 15, 5),
  ('OBRIGADO', 'Obrigado', '/videos/obrigado.mp4', 0.80, 15, 6),
  ('POR_FAVOR', 'Por favor', '/videos/por-favor.mp4', 0.80, 15, 7),
  ('DESCULPA', 'Desculpa', '/videos/desculpa.mp4', 0.80, 15, 8),
  ('TUDO_BEM', 'Tudo bem?', '/videos/tudo-bem.mp4', 0.80, 15, 9)
) as lesson_data(gesture_name, display_name, video_ref_url, min_confidence_threshold, xp_reward, order_index)
where m.slug = 'saudacoes'
on conflict (module_id, gesture_name) do update set
  display_name = excluded.display_name,
  video_ref_url = excluded.video_ref_url,
  min_confidence_threshold = excluded.min_confidence_threshold,
  xp_reward = excluded.xp_reward,
  order_index = excluded.order_index,
  updated_at = timezone('utc'::text, now());

-- Verify data was inserted
select
  'Lessons created successfully' as status,
  count(*) as total_lessons,
  count(distinct module_id) as modules_with_lessons
from public.lessons;
