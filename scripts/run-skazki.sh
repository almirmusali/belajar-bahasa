#!/bin/bash
# Рисует все иллюстрации сказки и доводит их до готового к деплою вида.
#
#   scripts/run-skazki.sh [slug]
#
# Скрипт написан под работу вслепую и вдогонку: части сказки могут дописываться
# прямо во время прогона, поэтому на каждом круге он заново собирает книгу и
# дорисовывает только то, чего ещё нет. Генератор идемпотентен, так что упавший
# или прерванный прогон догоняется простым перезапуском — ничего не рисуется
# дважды.
#
# Заканчивает, когда собраны все 20 частей и нарисованы все сцены. После этого
# переводит PNG в WebP: двести PNG весят под 400 МБ и в репозиторий такое
# класть нельзя.
set -uo pipefail

SLUG="${1:-ezhinka-ulya}"
BB="$HOME/Code/belajar-bahasa"
PROMPTS="$BB/data/skazki/$SLUG.prompts.json"
COVER_PROMPTS="$BB/data/skazki/$SLUG.covers.prompts.json"
OUT="$BB/public/skazki/$SLUG"
ART="$BB/data/skazki/$SLUG/art"
PARTS="$BB/data/skazki/$SLUG/parts"
WANT_PARTS=20

cd "$BB" || exit 1
mkdir -p "$OUT" "$ART"

count_scenes() { python3 -c "import json;print(len(json.load(open('$PROMPTS'))))" 2>/dev/null || echo 0; }
# Обложки лежат в той же папке, но считать их вместе со сценами нельзя: они
# добили бы счётчик до нужного числа раньше, чем нарисуется последняя сцена,
# и цикл вышел бы, не дорисовав книгу.
count_drawn()  { ls "$OUT"/*.png "$OUT"/*.webp 2>/dev/null | grep -v -e '-cover\.' -e '/cover\.' | sed 's/\.[a-z]*$//' | sort -u | wc -l | tr -d ' '; }
count_parts()  { ls "$PARTS"/p*.json 2>/dev/null | wc -l | tr -d ' '; }

round=0
while true; do
    round=$((round + 1))
    # Сборка книги может ругаться на недописанные части — это не повод
    # останавливаться: промпты для уже готовых частей она всё равно обновит.
    node scripts/build-skazki.mjs "$SLUG" >/dev/null 2>&1 || true

    parts=$(count_parts)
    scenes=$(count_scenes)
    drawn=$(count_drawn)
    echo "=== круг $round: частей $parts/$WANT_PARTS, сцен $scenes, нарисовано $drawn ==="

    # Обложки рисуются первыми: они нужны витрине раньше, чем сцены внутри
    # частей, и их всего двадцать одна.
    if [ -f "$COVER_PROMPTS" ]; then
        python3 scripts/generate-illustrations-local.py "$SLUG" \
            --prompts "$COVER_PROMPTS" --out-dir "$ART"
        python3 scripts/make-skazki-covers.py "$SLUG"
    fi

    if [ "$scenes" -gt 0 ]; then
        python3 scripts/generate-illustrations-local.py "$SLUG" \
            --prompts "$PROMPTS" --out-dir "$OUT"
    fi

    parts=$(count_parts)
    scenes=$(count_scenes)
    drawn=$(count_drawn)
    covers_want=$(python3 -c "import json;print(len(json.load(open('$COVER_PROMPTS'))))" 2>/dev/null || echo 0)
    covers_have=$(ls "$ART"/*.png 2>/dev/null | wc -l | tr -d ' ')
    if [ "$parts" -ge "$WANT_PARTS" ] && [ "$drawn" -ge "$scenes" ] && [ "$scenes" -gt 0 ] \
       && [ "$covers_have" -ge "$covers_want" ]; then
        echo "все части на месте, $scenes картинок и $covers_have обложек нарисованы"
        break
    fi

    # Ждём дописывающиеся части. Если рисовать было нечего, пауза длиннее:
    # значит, круг прошёл вхолостую и упираться смысла нет.
    sleep 60
done

echo "=== перевод в WebP ==="
node scripts/webp-skazki.mjs "$SLUG"

echo "=== пересборка книги начисто ==="
node scripts/build-skazki.mjs "$SLUG"

echo "готово: $(ls "$OUT"/*.webp 2>/dev/null | wc -l | tr -d ' ') картинок в $OUT"
