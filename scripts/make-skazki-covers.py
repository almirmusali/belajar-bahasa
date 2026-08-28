#!/usr/bin/env python3
"""Обложки сказки: арт от модели + настоящая типографика.

    python3 scripts/make-skazki-covers.py ezhinka-ulya [--only 3,7]

Слои разведены по той же причине, что и у книг читалки (scripts/make-book-cover.py):
диффузионные модели не умеют писать буквы, поэтому название кладётся вёрсткой
поверх готового арта. Здесь это важнее вдвойне — обложек двадцать одна, и
переписать название на всех надо уметь без единой перерисовки.

    data/skazki/<slug>/art/cover.png        ← рисует модель (арт без текста)
    data/skazki/<slug>/art/p07-cover.png    ←
    public/skazki/<slug>/cover.png          ← готовая обложка книги
    public/skazki/<slug>/p07-cover.png      ← готовая обложка части

Название всегда ложится на кремовую плашку сверху, а не прямо на картинку:
плашка читается на любом арте — и на ночном тёмно-синем, и на светлом снежном,
— а промпты обложек написаны так, что сверху у них воздух.

Рендерит headless Chrome: он уже используется в проекте и умеет letter-spacing,
переносы и тени, которых нет у растровых библиотек.
"""
import argparse
import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H = 768, 1024

# Georgia — из немногих системных шрифтов с полной кириллицей и тёплым,
# «книжным» рисунком; Comic-подобные для сказки на ночь слишком крикливы.
FONT = 'Georgia, "PT Serif", "Times New Roman", serif'

CREAM = "#fdf8ef"
BROWN = "#5d3a1f"
OCHRE = "#b07a34"

HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html, body {{ width:{w}px; height:{h}px; overflow:hidden; background:{cream}; }}
  .cover {{ position:relative; width:{w}px; height:{h}px; overflow:hidden; }}
  .art {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }}
  /* Плашка сверху: непрозрачная в верхней части и растворяющаяся книзу, чтобы
     не было жёсткой линии поперёк картинки. */
  .band {{
    position:absolute; left:0; right:0; top:0;
    padding:{pad_top}px 56px {pad_bottom}px; text-align:center;
    font-family:{font}; color:{brown};
    background:linear-gradient(to bottom,
      {cream} 0%, {cream} 72%, rgba(253,248,239,.92) 88%, rgba(253,248,239,0) 100%);
  }}
  .kicker {{
    font-size:19px; letter-spacing:.3em; text-indent:.3em;
    text-transform:uppercase; color:{ochre};
  }}
  .rule {{ width:56px; height:2px; margin:14px auto; background:{ochre}; opacity:.5; }}
  h1 {{
    font-size:{title_size}px; line-height:1.14; font-weight:700;
    text-wrap:balance; letter-spacing:-.01em;
  }}
  .sub {{
    margin-top:16px; font-size:23px; line-height:1.45;
    font-style:italic; color:{ochre};
  }}
  .tag {{
    margin-top:18px; font-size:14px; letter-spacing:.28em; text-indent:.28em;
    text-transform:uppercase; color:{ochre}; opacity:.85;
  }}
</style></head><body>
  <div class="cover">
    <img class="art" src="data:image/png;base64,{art}">
    <div class="band">
      {kicker}
      <h1>{title}</h1>
      {sub}
      {tag}
    </div>
  </div>
</body></html>"""


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def title_size(title, big):
    """Длинные названия ужимаем, чтобы плашка не съезжала на картинку."""
    n = len(title)
    if big:
        return 60 if n <= 22 else 52 if n <= 34 else 44
    return 50 if n <= 18 else 42 if n <= 30 else 36


def render(art_file, out, *, title, kicker="", sub="", tag="", big=False):
    html = HTML.format(
        w=W, h=H, cream=CREAM, brown=BROWN, ochre=OCHRE, font=FONT,
        pad_top=52 if big else 46,
        pad_bottom=64 if big else 56,
        title_size=title_size(title, big),
        art=base64.b64encode(art_file.read_bytes()).decode(),
        kicker=f'<div class="kicker">{esc(kicker)}</div><div class="rule"></div>' if kicker else "",
        title=esc(title),
        sub=f'<div class="sub">{esc(sub)}</div>' if sub else "",
        tag=f'<div class="tag">{esc(tag)}</div>' if tag else "",
    )
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "cover.html"
        page.write_text(html)
        shot = Path(tmp) / "shot.png"
        r = subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
             f"--screenshot={shot}", f"--window-size={W},{H}", page.as_uri()],
            capture_output=True, text=True, timeout=120,
        )
        if not shot.exists():
            print("  x Chrome не отдал скриншот: " + (r.stderr or "")[-300:], file=sys.stderr)
            return False
        out.write_bytes(shot.read_bytes())
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?", default="ezhinka-ulya")
    ap.add_argument("--only", help="через запятую: только эти номера частей (0 — обложка книги)")
    args = ap.parse_args()

    book_file = REPO / "data" / "skazki" / f"{args.slug}.json"
    if not book_file.exists():
        print(f"нет книги {book_file} — сначала npm run skazki:build", file=sys.stderr)
        return 1
    book = json.loads(book_file.read_text())

    art_dir = REPO / "data" / "skazki" / args.slug / "art"
    out_dir = REPO / "public" / "skazki" / args.slug
    only = set(int(x) for x in args.only.split(",")) if args.only else None

    done = missing = 0

    if only is None or 0 in only:
        art = art_dir / "cover.png"
        if art.exists():
            if render(art, out_dir / "cover.png", title=book["title"],
                      sub=book["subtitle"], tag=book["ageHint"], big=True):
                print(f"  + обложка книги: {book['title']}")
                done += 1
        else:
            print(f"  - нет арта {art.name}")
            missing += 1

    for part in book["parts"]:
        if only is not None and part["num"] not in only:
            continue
        name = f"p{part['num']:02d}-cover"
        art = art_dir / f"{name}.png"
        if not art.exists():
            print(f"  - нет арта {name}.png")
            missing += 1
            continue
        if render(art, out_dir / f"{name}.png",
                  title=part["title"], kicker=f"Часть {part['num']}"):
            print(f"  + {part['num']:2d}. {part['title']}")
            done += 1

    print(f"\nсобрано обложек: {done}, не хватает арта: {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
