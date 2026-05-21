-- Ежедневная статистика обучения: сколько карточек просмотрено и сколько секунд проведено
create table public.study_activity (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  cards_viewed int not null default 0,
  seconds_spent int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index study_activity_user_day_idx
  on public.study_activity (user_id, day desc);

alter table public.study_activity enable row level security;

create policy "select own activity"
  on public.study_activity for select
  using (auth.uid() = user_id);

create policy "insert own activity"
  on public.study_activity for insert
  with check (auth.uid() = user_id);

create policy "update own activity"
  on public.study_activity for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "delete own activity"
  on public.study_activity for delete
  using (auth.uid() = user_id);
