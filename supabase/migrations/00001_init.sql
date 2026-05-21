-- Прогресс изучения слов (по наборам словаря)
create table public.learned_words (
  user_id uuid not null references auth.users on delete cascade,
  set_slug text not null,
  word_id text not null,
  learned_at timestamptz not null default now(),
  primary key (user_id, set_slug, word_id)
);

create index learned_words_user_set_idx
  on public.learned_words (user_id, set_slug);

alter table public.learned_words enable row level security;

create policy "select own learned words"
  on public.learned_words for select
  using (auth.uid() = user_id);

create policy "insert own learned words"
  on public.learned_words for insert
  with check (auth.uid() = user_id);

create policy "delete own learned words"
  on public.learned_words for delete
  using (auth.uid() = user_id);

-- Прогресс по урокам
create table public.lesson_progress (
  user_id uuid not null references auth.users on delete cascade,
  lesson_id int not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "select own lesson progress"
  on public.lesson_progress for select
  using (auth.uid() = user_id);

create policy "insert own lesson progress"
  on public.lesson_progress for insert
  with check (auth.uid() = user_id);

create policy "delete own lesson progress"
  on public.lesson_progress for delete
  using (auth.uid() = user_id);
