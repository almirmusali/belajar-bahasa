# The Marauders — стайл-библия иллюстраций

Единый стиль для всех 30 иллюстраций (обложка + 3 части + 26 глав).
Каждый промпт = STYLE + CHARACTERS (кто в сцене) + сцена главы + MOOD части.

## STYLE (подмешивается в каждый промпт)

> Muted watercolor and ink book illustration in the tradition of classic British
> storybooks. Loose expressive linework, soft translucent washes, visible paper
> texture. Cinematic composition, strong single light source. Nostalgic and
> melancholic — a memory recalled decades later. No text, no captions, no
> borders, no watermark. Landscape 3:2.

## Палитра по частям

- **Part One: The Castle (гл. 1–12)** — тёплая: янтарный свет свечей и каминов
  против глубоких сине-серых теней; золотистая осень, зелень Шотландии.
  Mood: warm, alive, golden.
- **Part Two: The War (гл. 13–20)** — холоднее: пасмурные серо-синие тона,
  тёплый свет остаётся только маленькими островками (окно, свеча, костёр).
  Mood: cold, wary, fading warmth.
- **Part Three: The Longest Night (гл. 21–26)** — почти монохром: ночь,
  пепел, туман; один тёплый акцент на кадр (тыква, фонарь, фотография).
  Mood: ashen, grieving, a single warm ember.

## CHARACTERS (карточки — вставлять только тех, кто в сцене)

- **James Potter** — messy jet-black hair sticking up in all directions, round
  glasses, lean build, confident easy grin.
- **Sirius Black** — long dark hair, strikingly handsome aristocratic face,
  careless elegance, grey eyes.
- **Remus Lupin** (рассказчик) — light-brown hair, pale tired face with faint
  thin scars, worn cardigan or jumper, gentle guarded expression.
- **Peter Pettigrew** — small and round, watery blue eyes, mousy blond hair,
  eager nervous smile.
- **Lily Evans** — dark red hair to her shoulders, bright almond-shaped green
  eyes, warm direct gaze.

Возраст указывается в каждом промпте (11 лет в 1971 → 21 год в 1981).

## Технические решения

- Формат: 3:2 landscape, минимум 1K по длинной стороне; сохранение в
  `public/reading/the-marauders/ch-<id>.webp` (id из the-marauders.json, 0–30).
- Обложка: отдельный вертикальный 3:4 промпт → `public/reading/the-marauders.png`
  (заменяет svg-заглушку).
- Читалка рендерит картинку автоматически, если файл существует
  (`chapterIllustrationUrl` в lib/reading.ts).
- Генератор: Gemini (Nano Banana), 30 готовых промптов в
  `the-marauders.prompts.json` (id совпадают с главами `the-marauders.json`).

## Как запускать

**Автоматически** — нужен API-ключ с включённым биллингом (подписка AI Pro
API не покрывает, см. CLAUDE.md):

```
GEMINI_API_KEY=... node scripts/generate-illustrations.mjs the-marauders
```

Скрипт идемпотентен: уже существующие файлы пропускает, `--only 3,4` гонит
отдельные главы, `--model gemini-3-pro-image` — для обложки и ключевых сцен.

**Руками** — открыть gemini.google.com и вставлять `prompt` из JSON по одному,
сохраняя результат как `public/reading/the-marauders/<file>.png`. Квоты Pro
(~100 картинок в день) хватает на всю книгу за один заход.
