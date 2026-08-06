# Belajar Bahasa

Платформа для изучения индонезийского языка (Bahasa Indonesia).

## Стек

- **Next.js 15** (App Router, RSC)
- **TypeScript**
- **Tailwind CSS** + CSS-переменные (тема под shadcn/ui)
- **shadcn/ui** (заготовка `components.json`, алиасы `@/components`, `@/lib`)
- **lucide-react** для иконок

Проект подготовлен под добавление компонентов из [v0.app](https://v0.app) — копируйте компоненты прямо в `components/ui/`.

## Локальный запуск

```bash
npm install
npm run dev
```

Сайт откроется на http://localhost:3000.

## Озвучка словаря

Индонезийские слова озвучены голосами ElevenLabs через [Voicer API](https://voicer.mat3u.com/docs).
Готовые MP3 лежат в `public/audio/id/` и отдаются как статика — внешних
запросов в рантайме нет, и в оффлайне они работают из кеша service worker'а.

Имя файла — это `FNV-1a`-хэш от `id:<текст>`. Хэш считается одинаково в
[`lib/audio-url.ts`](lib/audio-url.ts) и в скрипте генерации, поэтому фронт
находит файл без индекса. Нет файла — [`SpeakButton`](components/speak-button.tsx)
и [`FlashcardPlayer`](components/flashcard-player.tsx) молча падают на
системный голос Web Speech, как было раньше.

Для генерации нужен ключ в `.env.local`:

```
VOICER_API_KEY=...
```

```bash
npm run audio:voices   # голоса-кандидаты
npm run audio:sample   # начитать демо каждым голосом в public/audio/_samples
npm run audio:dry      # сколько символов уйдёт и сколько осталось квоты
npm run audio:gen      # озвучить слова
```

Скрипт идемпотентен: уже озвученное на диске пропускается, так что после
обрыва достаточно перезапустить. Примеры к словам по умолчанию не озвучиваются
(это ещё ~106 тысяч символов против ~10 тысяч на слова) — включаются флагом:

```bash
npm run audio:gen -- --examples
npm run audio:gen -- --voice=george   # другой голос
```

Как это работает под капотом: у Voicer асинхронное API (задача → опрос →
скачивание), а `split_type: "paragraphs"` + `split_output: true` возвращают
ZIP из отдельных MP3 — по одному на абзац. Скрипт склеивает батч фраз через
пустую строку и раскладывает чанки архива по именам, поэтому 1262 слова
стоят 13 задач, а не 1262 запроса. Если число чанков не совпало с числом
фраз, батч отбрасывается целиком: лучше недостача, чем озвучка под чужим именем.

## Деплой

Авто-деплой на [Vercel](https://vercel.com): каждый push в `main` уходит в продакшн.
