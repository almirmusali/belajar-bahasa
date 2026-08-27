#!/usr/bin/env python3
"""Сборка обложки книги: арт от модели + настоящая типографика.

    python3 scripts/make-book-cover.py the-marauders

Слои разведены намеренно. Диффузионные модели не умеют писать буквы — вместо
слов получается каша, — поэтому текст кладётся вёрсткой поверх готового арта.
Побочная выгода: название и подзаголовок меняются без перерисовки картинки.

    data/reading/illustrations/<slug>.cover-art.png   ← рисует модель
    public/reading/<slug>.png                          ← итоговая обложка

Заголовок и подзаголовок берутся из <slug>.json, то есть из самой книги.
Рендерит headless Chrome: он уже есть на обеих машинах и умеет letter-spacing
и тени, которых нет у простых растровых библиотек.
"""
import base64
import json
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
W, H = 768, 1024
SHIFT = 84   # на сколько поднять арт, чтобы животные ушли из-под названия

HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  html, body {{ width:{w}px; height:{h}px; overflow:hidden; background:#080a0e; }}
  .cover {{ position:relative; width:{w}px; height:{h}px; overflow:hidden;
            background:#080a0e; }}
  /* Арт сдвинут вверх: модель ставит животных ниже, чем нужно, и название
     перечёркивало их. Освободившаяся полоса внизу — тон земли, стык прячет
     градиент, который доводится до непрозрачного. */
  .art {{ position:absolute; left:0; top:-{shift}px; width:100%; }}
  /* Затемнение только снизу: текст ложится на землю, а не на луну. */
  .scrim {{
    position:absolute; left:0; right:0; bottom:0; height:46%;
    background:linear-gradient(to bottom,
      rgba(8,10,14,0) 0%, rgba(8,10,14,.55) 42%, rgba(8,10,14,.88) 100%);
  }}
  .type {{
    position:absolute; left:0; right:0; bottom:0;
    padding:0 54px 52px; text-align:center;
    font-family:"Hoefler Text", Baskerville, Georgia, serif;
    color:#F2E8D5; text-shadow:0 2px 18px rgba(0,0,0,.75);
  }}
  .rule {{
    width:74px; height:1px; margin:0 auto 26px;
    background:rgba(242,232,213,.55);
  }}
  h1 {{
    font-size:{title_size}px; line-height:1.06; font-weight:600;
    letter-spacing:.13em; text-indent:.13em;
    text-transform:uppercase; text-wrap:balance;
  }}
  .sub {{
    margin-top:20px; font-size:19px; line-height:1.5;
    letter-spacing:.05em; font-style:italic; color:rgba(242,232,213,.82);
  }}
  .tag {{
    margin-top:22px; font-size:12px; letter-spacing:.32em; text-indent:.32em;
    text-transform:uppercase; color:rgba(242,232,213,.6);
  }}
</style></head><body>
  <div class="cover">
    <img class="art" src="data:image/png;base64,{art}">
    <div class="scrim"></div>
    <div class="type">
      <div class="rule"></div>
      <h1>{title}</h1>
      {sub}
      {tag}
    </div>
  </div>
</body></html>"""


def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def main(slug):
    art = REPO / "data" / "reading" / "illustrations" / f"{slug}.cover-art.png"
    if not art.exists():
        print(f"нет арта обложки: {art}", file=sys.stderr)
        return 1

    book = json.loads((REPO / "data" / "reading" / f"{slug}.json").read_text())
    title = book.get("title") or slug
    # Подзаголовок вида «описание — пометка»: пометка идёт отдельной строкой внизу.
    sub_raw = (book.get("subtitle") or "").split("—")
    sub = sub_raw[0].strip()
    tag = sub_raw[1].strip() if len(sub_raw) > 1 else ""

    html = HTML.format(
        w=W, h=H, shift=SHIFT,
        title_size=64 if len(title) <= 16 else 52,
        art=base64.b64encode(art.read_bytes()).decode(),
        title=esc(title),
        sub=f'<div class="sub">{esc(sub)}</div>' if sub else "",
        tag=f'<div class="tag">{esc(tag)}</div>' if tag else "",
    )

    out = REPO / "public" / "reading" / f"{slug}.png"
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
            print("Chrome не отдал скриншот:\n" + (r.stderr or "")[-500:], file=sys.stderr)
            return 1
        out.write_bytes(shot.read_bytes())

    print(f"обложка собрана: {out} ({out.stat().st_size // 1024}K, {W}x{H})")
    print(f"  заголовок: {title}")
    if sub:
        print(f"  подзаголовок: {sub}")
    if tag:
        print(f"  пометка: {tag}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "the-marauders"))
