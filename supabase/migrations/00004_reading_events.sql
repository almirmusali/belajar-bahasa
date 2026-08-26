-- Поведение читателей в читалке: сырой лог событий + витрины для админки.
--
-- Пишет сюда только сервер (app/api/track/route.ts с service-role ключом),
-- читает только админка (тоже service-role). Поэтому RLS включён, а политик
-- нет: для anon/authenticated таблица закрыта наглухо, service role политики
-- обходит.
--
-- Личность читателя двойная: user_id — если он залогинен, anon_id — случайный
-- UUID из localStorage, который есть у всех. Когда аноним логинится, роут
-- дописывает user_id в его старые анонимные события (см. update в route.ts),
-- так что история склеивается сама.

create table public.reading_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  anon_id text,
  book_slug text not null,
  chapter int not null,
  -- chapter_open | word_lookup | par_translate | show_all | read_progress | read_time
  type text not null,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index reading_events_user_idx
  on public.reading_events (user_id, created_at desc);
create index reading_events_anon_idx
  on public.reading_events (anon_id, created_at desc);

alter table public.reading_events enable row level security;

-- Витрины. security_invoker обязателен: без него view выполняется от имени
-- владельца (postgres) и обходит RLS таблицы — любой аноним прочитал бы всю
-- аналитику через PostgREST. С ним обычный клиент получает пустоту, а
-- service role — всё.

-- День читателя по книгам: счётчики взаимодействий и время чтения.
-- Часовой пояс захардкожен на WITA (Бали/Ломбок, UTC+8): «день» должен
-- совпадать с днём читателя, а не с UTC-полуночью посреди его вечера.
create view public.reading_daily with (security_invoker = true) as
select
  coalesce(user_id::text, 'anon:' || anon_id) as reader,
  (created_at at time zone 'Asia/Makassar')::date as day,
  book_slug,
  count(*) filter (where type = 'word_lookup') as lookups,
  count(*) filter (where type = 'par_translate' and (meta->>'open')::boolean) as par_opens,
  count(*) filter (where type = 'chapter_open') as chapter_opens,
  coalesce(sum((meta->>'seconds')::int) filter (where type = 'read_time'), 0) as seconds,
  coalesce(sum((meta->>'seconds')::int)
    filter (where type = 'read_time' and (meta->>'show_all')::boolean), 0) as seconds_show_all
from public.reading_events
group by 1, 2, 3;

-- Глава глазами читателя: сколько прочитано, сколько абзацев раскрывал
-- переводом, сколько раз подглядывал в слова, сколько времени провёл.
create view public.reading_chapter_stats with (security_invoker = true) as
select
  coalesce(user_id::text, 'anon:' || anon_id) as reader,
  book_slug,
  chapter,
  max((meta->>'words')::int) filter (where type = 'chapter_open') as words_total,
  max((meta->>'blocks')::int) as blocks_total,
  coalesce(max((meta->>'words_read')::int) filter (where type = 'read_progress'), 0) as words_read,
  coalesce(max((meta->>'block')::int) filter (where type = 'read_progress'), 0) as last_block,
  coalesce(bool_or(type = 'read_progress' and (meta->>'done')::boolean), false) as done,
  count(distinct meta->>'block')
    filter (where type = 'par_translate' and (meta->>'open')::boolean) as blocks_translated,
  count(*) filter (where type = 'word_lookup') as lookups,
  coalesce(sum((meta->>'seconds')::int) filter (where type = 'read_time'), 0) as seconds
from public.reading_events
group by 1, 2, 3;

-- Список читателей для входной страницы админки.
create view public.reading_readers with (security_invoker = true) as
select
  coalesce(user_id::text, 'anon:' || anon_id) as reader,
  max(user_id::text) as user_id,
  min(created_at) as first_seen,
  max(created_at) as last_seen,
  count(*) as events
from public.reading_events
group by 1;
