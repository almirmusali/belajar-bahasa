#!/usr/bin/env python3
"""Локальная генерация иллюстраций книги — Flux.1-schnell через mflux (Apple Silicon).

    python3 scripts/generate-illustrations-local.py the-marauders [--only 3,4] [--redo 7]

Читает data/reading/illustrations/<slug>.prompts.json, кладёт картинки в
public/reading/<slug>/<file>.png; запись с cover=true — в public/reading/<slug>.png.

Идемпотентен: готовые файлы пропускает, поэтому упавший прогон догоняется
простым перезапуском. Квантованная модель сохраняется один раз в ~/models,
иначе mflux пересчитывал бы её на каждой из тридцати картинок.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
BIN = Path.home() / ".local" / "bin"
# Модель задаётся переменной MFLUX_MODEL: schnell (нужен токен HuggingFace,
# репозиторий gated) или z-image-turbo (открытый, ничего не требует).
MODEL_NAME = os.environ.get("MFLUX_MODEL", "z-image-turbo")
MODEL_DIR = Path.home() / "models" / ("mflux-" + MODEL_NAME + "-8bit")
STEPS = int(os.environ.get("MFLUX_STEPS", "4" if MODEL_NAME == "schnell" else "8"))
QUANT = 8          # 8 бит: влезает в 32 ГБ без свопа

# У каждого семейства моделей свой генератор: mflux-generate умеет только FLUX
# и на Z-Image падает, требуя text_encoder_2, которого у той просто нет.
GENERATOR = {
    "schnell": "mflux-generate",
    "dev": "mflux-generate",
    "krea-dev": "mflux-generate",
    "z-image-turbo": "mflux-generate-z-image-turbo",
    "z-image": "mflux-generate-z-image",
    "qwen-image": "mflux-generate-qwen",
}.get(MODEL_NAME, "mflux-generate")


def dims(aspect):
    """Длинная сторона 1024, короткая по пропорции, кратно 16 (требование VAE)."""
    try:
        w_r, h_r = (int(x) for x in aspect.split(":"))
    except Exception:
        w_r, h_r = 3, 2
    if w_r >= h_r:
        return 1024, max(16, round(1024 * h_r / w_r / 16) * 16)
    return max(16, round(1024 * w_r / h_r / 16) * 16), 1024


def ensure_model():
    if (MODEL_DIR / "transformer").exists() or any(MODEL_DIR.glob("*.safetensors")):
        print("модель на месте: " + str(MODEL_DIR), flush=True)
        return
    print("качаю " + MODEL_NAME + " и сохраняю 8-битную копию — разово, ~30-60 мин", flush=True)
    MODEL_DIR.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [str(BIN / "mflux-save"), "--model", MODEL_NAME,
         "--quantize", str(QUANT), "--path", str(MODEL_DIR)],
        check=True,
    )
    print("квантованная модель сохранена", flush=True)


def generate(scene, out):
    name = scene["file"]
    w, h = dims(scene.get("aspect", "3:2"))
    seed = scene.get("seed", 1000 + scene["id"])
    out.parent.mkdir(parents=True, exist_ok=True)
    # mflux не перезаписывает: при совпадении имени он молча пишет рядом
    # <имя>_1.png. Поэтому цель убираем сами, иначе --redo не заменяет картинку,
    # а плодит копии, и в читалке остаётся старая.
    if out.exists():
        out.unlink()
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        f.write(scene["prompt"])
        prompt_file = f.name
    cmd = [
        str(BIN / GENERATOR),
        "--model", str(MODEL_DIR), "--base-model", MODEL_NAME,
        "--prompt-file", prompt_file,
        "--steps", str(STEPS), "--seed", str(seed),
        "--width", str(w), "--height", str(h),
        "--vae-tiling",
        "--output", str(out),
    ]
    t0 = time.time()
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    finally:
        os.unlink(prompt_file)
    if r.returncode != 0 or not out.exists():
        tail = (r.stderr or r.stdout or "")[-400:]
        print("  x " + name + ": " + tail, flush=True)
        return False
    kb = out.stat().st_size // 1024
    print("  + %s %dx%d seed=%d %dK за %.0fс" % (name, w, h, seed, kb, time.time() - t0), flush=True)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--only", help="через запятую: только эти id")
    ap.add_argument("--redo", help="через запятую: перегенерировать, даже если файл есть")
    args = ap.parse_args()

    pf = REPO / "data" / "reading" / "illustrations" / (args.slug + ".prompts.json")
    scenes = json.loads(pf.read_text())
    only = set(int(x) for x in args.only.split(",")) if args.only else None
    redo = set(int(x) for x in args.redo.split(",")) if args.redo else set()

    ensure_model()

    done = failed = skipped = 0
    for scene in scenes:
        if only is not None and scene["id"] not in only:
            continue
        if scene.get("cover"):
            # Обложка — двухслойная: модель рисует только арт, текст кладёт
            # scripts/make-book-cover.py. Иначе перерисовка арта затирала бы
            # готовую обложку с типографикой.
            out = REPO / "data" / "reading" / "illustrations" / (args.slug + ".cover-art.png")
        else:
            out = REPO / "public" / "reading" / args.slug / (scene["file"] + ".png")
        if out.exists() and scene["id"] not in redo:
            skipped += 1
            continue
        if generate(scene, out):
            done += 1
        else:
            failed += 1
    print("\nитог: сгенерировано %d, пропущено %d, упало %d" % (done, skipped, failed), flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
