#!/bin/bash
# Генерация иллюстраций книги на арендованном GPU (FLUX.2 dev через ComfyUI).
# Использование: gen-illustrations-flux2.sh <slug>
set -euo pipefail
SLUG=$1
BB=$HOME/Code/belajar-bahasa
VF=$HOME/Code/video-factory
SRC=$BB/data/reading/illustrations/$SLUG.prompts.json
OUT=$BB/public/reading/$SLUG
mkdir -p "$OUT"
TMP=$(mktemp -d)

python3 - "$SRC" "$TMP" <<'PY'
import json, sys, pathlib, collections
src, tmp = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
data = json.loads(src.read_text())
if isinstance(data, dict): data = data.get('prompts') or data.get('scenes') or []
groups = collections.defaultdict(list)
for e in data:
    groups[e.get('aspect','3:2')].append({'id': e['file'], 'prompt': e['prompt']})
for aspect, items in groups.items():
    name = aspect.replace(':','x')
    (tmp / f'{name}.json').write_text(json.dumps(items, ensure_ascii=False))
    print(f'{name} {len(items)}')
PY

SIZE_3x2=1536x1024
SIZE_3x4=1008x1344
for f in "$TMP"/*.json; do
  key=$(basename "$f" .json)
  var="SIZE_${key}"
  size=${!var:-1024x1024}
  echo "=== $SLUG · $key · $size ==="
  (cd "$VF" && .venv/bin/python gen_images.py --batch "$f" --out-dir "$OUT" --size "$size")
done

# обложка книги лежит отдельным файлом рядом
[ -f "$OUT/cover.png" ] && cp "$OUT/cover.png" "$BB/public/reading/$SLUG.png" && echo "обложка → public/reading/$SLUG.png"
rm -rf "$TMP"
echo "готово: $SLUG — $(ls "$OUT"/*.png | wc -l | tr -d ' ') файлов"
