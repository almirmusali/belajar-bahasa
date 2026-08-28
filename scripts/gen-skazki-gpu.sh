#!/bin/bash
# Иллюстрации сказки на арендованном GPU (ComfyUI на vast.ai).
#
#   scripts/gen-skazki-gpu.sh [slug] [zimage|flux2] [--covers-only|--scenes-only]
#
# По умолчанию — zimage, то есть Z-Image Turbo: ровно та же модель, что крутится
# локально на студии через mflux. Это не случайный выбор, а требование книги:
# половину картинок уже рисовала она, а смешивать в одном издании две модели
# нельзя — у них разный рисунок, и это видно на каждом развороте.
#
# Замеры на RTX A6000 при 1.35 Мпикс (одни и те же три промпта):
#   Z-Image Turbo  ~18 с на кадр   вся книга ~1 ч
#   FLUX.2 dev     ~52 с на кадр   вся книга ~3 ч 15 мин
# Локально на M1 Max та же Z-Image даёт ~85 с на кадр при 0.75 Мпикс.
# FLUX.2 оставлен доступным: рисует богаче и умеет опорные картинки.
#
# Требует поднятого туннеля до ComfyUI (см. скил 12flux2):
#   cd ~/Code/video-factory && python server/vast.py up --profile quality
#   cd ~/Code/video-factory && python server/vast.py tunnel --profile quality
#
# Идемпотентен: готовые файлы пропускаются, упавший прогон догоняется той же
# командой.
set -euo pipefail

SLUG="${1:-ezhinka-ulya}"
MODEL="${2:-zimage}"
MODE="${3:-all}"
BB="$HOME/Code/belajar-bahasa"
VF="$HOME/Code/video-factory"

SCENES_SRC="$BB/data/skazki/$SLUG.prompts.json"
COVERS_SRC="$BB/data/skazki/$SLUG.covers.prompts.json"
SCENES_OUT="$BB/public/skazki/$SLUG"
COVERS_OUT="$BB/data/skazki/$SLUG/art"

# Пропорции те же, что в промптах (3:2 у сцен, 3:4 у обложек), но длинная
# сторона крупнее локальной: арендованная карта это позволяет.
SIZE_3x2="1536x1024"
SIZE_3x4="1008x1344"

curl -s -m 5 localhost:8188/system_stats > /dev/null \
  || { echo "ComfyUI не отвечает на localhost:8188 — подними туннель (скил 12flux2)"; exit 1; }

mkdir -p "$SCENES_OUT" "$COVERS_OUT"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# gen_images.py именует файл по полю id, поэтому в id кладём имя файла, а сид
# считаем по числовому id сцены — той же формулой, что и локальный генератор,
# чтобы повторный прогон давал ту же картинку.
prepare() {
    python3 - "$1" "$2" <<'PY'
import json, pathlib, sys
src, dst = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
items = [{"id": s["file"], "prompt": s["prompt"], "seed": s.get("seed", 1000 + s["id"])}
         for s in json.loads(src.read_text())]
dst.write_text(json.dumps(items, ensure_ascii=False))
print(len(items))
PY
}

run() {
    local src="$1" out="$2" size="$3" title="$4"
    [ -f "$src" ] || { echo "нет файла промптов: $src"; return 0; }
    local batch="$TMP/$(basename "$src")"
    local n
    n=$(prepare "$src" "$batch")
    echo "=== $title: $n картинок, $size, модель $MODEL → $out ==="
    (cd "$VF" && .venv/bin/python gen_images.py --batch "$batch" --out-dir "$out" \
        --size "$size" --model "$MODEL")
}

[ "$MODE" != "--scenes-only" ] && run "$COVERS_SRC" "$COVERS_OUT" "$SIZE_3x4" "обложки"
[ "$MODE" != "--covers-only" ] && run "$SCENES_SRC" "$SCENES_OUT" "$SIZE_3x2" "иллюстрации"

echo
echo "обложек: $(ls "$COVERS_OUT"/*.png 2>/dev/null | wc -l | tr -d ' ')"
echo "иллюстраций: $(ls "$SCENES_OUT" 2>/dev/null | grep -cE '^p[0-9]{2}-[0-9]+\.png$' || echo 0)"
echo
echo "дальше: python3 scripts/make-skazki-covers.py $SLUG && node scripts/webp-skazki.mjs $SLUG"
