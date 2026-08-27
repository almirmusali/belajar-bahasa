# Иллюстрации к книгам: с чего продолжить

Документ для продолжения работы на Mac Studio или в новом диалоге.
Состояние на 27 августа 2026. Работа **на паузе**: книга «The Marauders»
переписывается, и генерировать картинки до окончания правок бессмысленно —
промпты привязаны к номерам глав (см. раздел «Первым делом»).

## Состояние

| что | готово | где |
|-----|--------|-----|
| Промпты, 30 сцен | да, но устареют после правки книги | `data/reading/illustrations/the-marauders.prompts.json` |
| Стайл-библия | да | `data/reading/illustrations/the-marauders.style.md` |
| Локальный генератор | да | `scripts/generate-illustrations-local.py` |
| Генератор через Gemini API | да, нужен биллинг | `scripts/generate-illustrations.mjs` |
| Обёртка для tmux + супервизор | да, супервизор не запустится | `scripts/run-marauders.sh` |
| Модель Z-Image-Turbo, 8 бит | да, 10 ГБ | `~/models/mflux-z-image-turbo-8bit` |
| Движок mflux | да, 1.1 ГБ | `~/.local/share/uv/tools/mflux` |
| Поддержка в читалке | да, в коммите `2af94b7` | `chapterIllustrationUrl` в `lib/reading.ts` |
| Сами картинки | **нет, ни одной** | `public/reading/the-marauders/` |

Два скрипта (`generate-illustrations-local.py`, `run-marauders.sh`)
**не закоммичены** — лежат в рабочей копии на студии как untracked.

## Где что лежит на студии

| путь | что это |
|------|---------|
| `~/Code/belajar-bahasa` | рабочая копия, git, ветка `main` — **работать здесь** |
| `~/belajar-bahasa` | копия деплоя, **без git**, её отдаёт LaunchAgent на :8766 |
| `~/models/mflux-z-image-turbo-8bit` | готовая квантованная модель, 10 ГБ |
| `~/.local/bin/mflux-*` | 37 команд mflux (генерация, сохранение, обучение LoRA) |
| `~/.cache/huggingface` | 2 ГБ, только faster-whisper — **не чистить** |

## Как запустить

Из `~/Code/belajar-bahasa`. Все команды идемпотентны: готовые файлы
пропускаются, поэтому упавший прогон догоняется простым перезапуском.

```bash
# вся книга
python3 scripts/generate-illustrations-local.py the-marauders

# отдельные главы
python3 scripts/generate-illustrations-local.py the-marauders --only 3,4,7

# перерисовать уже готовые (например, после смены сида в JSON)
python3 scripts/generate-illustrations-local.py the-marauders --redo 12

# только подготовить модель, ничего не рисуя
python3 scripts/generate-illustrations-local.py the-marauders --only 999
```

Долгий прогон — в tmux, чтобы пережить отключение ноутбука:

```bash
tmux new-session -d -s marauders "zsh -lc 'cd ~/Code/belajar-bahasa && python3 scripts/generate-illustrations-local.py the-marauders 2>&1 | tee ~/marauders.log'"
tmux attach -t marauders
```

Переключение модели — переменными, править код не нужно:

```bash
MFLUX_MODEL=schnell MFLUX_STEPS=4 HF_TOKEN=... python3 scripts/generate-illustrations-local.py the-marauders
```

По умолчанию `z-image-turbo`, 8 шагов. Главы рисуются 1024x688 (3:2),
обложка 768x1024 (3:4). Сид детерминированный: `1000 + id главы`, поэтому
повторный запуск даёт ту же картинку — чтобы получить другую, добавьте полю
сцены `seed` в JSON новое значение и запустите с `--redo`.

## Первым делом после правки книги

**Промпты нужно пересобрать, а не просто запустить генерацию.** Поле `id`
сцены равно `id` главы в `data/reading/the-marauders.json`. Если при
переписывании добавится, удалится или переедет хоть одна глава, нумерация
разъедется и картинки встанут не к тем главам — молча, без единой ошибки.

Порядок такой:

1. Пересобрать книгу: `node scripts/build-reading.mjs` (или как в SESSION.md).
2. Посмотреть новый список глав:
   `python3 -c "import json;d=json.load(open('data/reading/the-marauders.json'));[print(c['id'],c['num'],c['title']) for c in d['chapters']]"`
3. Сверить с `the-marauders.prompts.json` и переписать сцены под новые главы:
   для каждой главы — её самая визуальная сцена плюс блок стиля из
   `the-marauders.style.md` (он подмешивается в каждый промпт целиком).
4. Удалить устаревшие картинки, если они уже были нарисованы.
5. Запускать генерацию.

## Что требует человека

**1. Claude Code на студии не залогинен.** Нет `~/.claude/.credentials.json`,
`claude -p` отвечает «Not logged in». Из-за этого шаг супервизора в
`run-marauders.sh` падает за секунду. Побочное следствие важнее: **по этой же
причине молча не работает night-agent** — ночные задачи умирают на старте.

```bash
ssh mac-studio -t "zsh -lc claude"   # дальше /login
```

**2. Flux.1-schnell закрыт за токеном.** Лицензия по-прежнему Apache-2.0, но
HuggingFace пометил репозиторий `gated: auto`: без аккаунта и `HF_TOKEN`
скачивание падает с `GatedRepoError 401`. Одобрение выдаётся мгновенно.
Аккаунт на huggingface.co, согласие на странице `black-forest-labs/FLUX.1-schnell`,
токен в Settings → Access Tokens. Пока токена нет, работает `z-image-turbo`.

**3. Место на диске.** Сейчас свободно 68 ГБ. Установка второй модели съест
примерно столько же, сколько первая: около 45 ГБ во временном кэше плюс 10 ГБ
на квантованную копию. После сохранения квантованной версии кэш исходников
можно и нужно удалять — рабочая модель лежит отдельно в `~/models`.

## Грабли

- **`~/.local/bin` не в PATH неинтерактивного ssh.** `ssh mac-studio "mflux-generate"`
  скажет «command not found». Звать через `zsh -lc` или полным путём — в скрипте
  так и сделано.
- **Обложку перебивает старый SVG.** `coverUrl` в `lib/reading.ts` перебирает
  расширения в порядке svg, webp, png, поэтому `public/reading/the-marauders.svg`
  выигрывает у новой PNG-обложки. Переименовать в `.svg.off`, когда PNG устроит.
- **Подписка Google AI Pro не даёт квоты API.** Она работает только в UI AI
  Studio; `generate-illustrations.mjs` без Cloud Billing получает 429 с
  `limit: 0`. Вся книга по прайсу — около 2 долларов.
- **`npm run build` при живом dev-сервере ломается** — оба используют один
  `.next`. Останавливать dev перед сборкой.
- **`brew`, `timeout`, `uv` в PATH ssh отсутствуют.** `uv` ставился скриптом с
  astral.sh в `~/.local/bin`, `tmux` живёт в `/opt/homebrew/bin`.

## Чек-лист продолжения

1. Дождаться, пока книга устаканится.
2. Пересобрать `the-marauders.json` и **переписать промпты под новые главы**.
3. Прогнать одну главу для проверки стиля: `--only 3`.
4. Посмотреть результат глазами, при необходимости покрутить сид или промпт.
5. Запустить всю книгу в tmux.
6. Проверить, что читалка показывает картинки: `npm run dev`, открыть
   `/reading/the-marauders/3`.
7. Решить судьбу обложки (переименовать SVG или оставить).
8. Закоммитить скрипты, промпты и картинки.
