# Supabase setup

## Шаги для подключения

1. **Создай проект** на https://supabase.com
   - Name: `belajar-bahasa`
   - Region: ближайший (для России — `eu-central-1`)
2. Открой **Settings → API** и скопируй:
   - `Project URL`
   - `anon public` key
3. Добавь их в Vercel:
   - https://vercel.com/almirmusalis-projects/belajar-bahasa/settings/environment-variables
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
   - Для всех окружений (Production, Preview, Development)
4. И в локальный `.env.local` (создай файл рядом с `.env.example`)

## Применение миграции

Открой проект в Supabase → **SQL Editor** → нажми **New query** → вставь содержимое
`supabase/migrations/00001_init.sql` → нажми **Run**.

Это создаст две таблицы (`learned_words`, `lesson_progress`) с включёнными
Row Level Security политиками — каждый пользователь видит только свои данные.

## Настройка Email Auth

Открой **Authentication → Providers** → убедись, что **Email** включён.

По умолчанию Supabase требует подтверждение email. Чтобы письма приходили со ссылками
на твой сайт (а не на `localhost`):

1. Открой **Authentication → URL Configuration**
2. **Site URL**: `https://belajar-bahasa.vercel.app`
3. **Redirect URLs**: добавь
   - `https://belajar-bahasa.vercel.app/**`
   - `http://localhost:3000/**` (для локальной разработки)

## Что хранится

| Таблица | Поля | Описание |
|---|---|---|
| `auth.users` | (управляется Supabase) | Email, пароль (хеш), id |
| `public.learned_words` | user_id, set_slug, word_id, learned_at | Какие слова в каких наборах выучены |
| `public.lesson_progress` | user_id, lesson_id, completed_at | Какие уроки помечены пройденными |

RLS включён везде — пользователь видит/меняет только свои строки.
