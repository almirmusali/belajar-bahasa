# Память проекта

## Сборка и dev-сервер дерутся за .next

`npm run build` и запущенный `next dev` используют одну папку `.next`:
сборка при живом dev-сервере падает загадочным `TypeError: a[d] is not a
function` в webpack-runtime, а dev после сборки сыплет ENOENT на чанки.
Перед `npm run build` останавливать dev-сервер; после — перезапускать.

## Порт 3000 бывает занят чужим проектом

На этой машине на :3000 может висеть Remotion Studio из `reels-subtitles`.
Dev-сервер поднимать через `.claude/launch.json` (`belajar-dev`) — он сам
уходит на свободный порт.

## Аналитика читалки

События поведения читателей: `lib/track.ts` (клиентская очередь + beacon) →
`app/api/track/route.ts` (service-role insert) → таблица `reading_events` и
витрины (`supabase/migrations/00004_reading_events.sql`) → админка `/admin`.
Работает только при заданных `SUPABASE_SERVICE_ROLE_KEY` и `ADMIN_EMAILS`
в окружении сервера; без них события молча отбрасываются, `/admin` — 404.
user_id клиенту не доверяем — сервер берёт его из cookies-сессии, анонимная
история склеивается с аккаунтом по `anon_id` при первом залогиненном батче.
