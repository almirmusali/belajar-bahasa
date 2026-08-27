#!/bin/zsh
# Полный прогон иллюстраций "Мародёров" на студии: генерация локальным Flux,
# затем Claude-супервизор — смотрит картинки, перегенеривает брак, коммитит.
# Запускается в tmux, переживает выключение ноутбука.
set -u
export PATH="$HOME/.local/bin:$PATH"
cd "$HOME/Code/belajar-bahasa" || exit 1
LOG="$HOME/marauders-run.log"

echo "=== старт $(date +%F\ %T) ===" | tee -a "$LOG"
python3 scripts/generate-illustrations-local.py the-marauders 2>&1 | tee -a "$LOG"
echo "=== генерация закончена $(date +%F\ %T) ===" | tee -a "$LOG"

PROMPT="Ты доделываешь иллюстрации книги The Marauders в проекте ~/Code/belajar-bahasa.

Картинки уже сгенерированы локальной моделью Flux.1-schnell скриптом
scripts/generate-illustrations-local.py в public/reading/the-marauders/ch-<id>.png.
Список сцен и промптов: data/reading/illustrations/the-marauders.prompts.json,
единый стиль описан в data/reading/illustrations/the-marauders.style.md.

Сделай по порядку:

1. Сверь наличие: для каждой записи prompts.json без cover должен быть файл
   public/reading/the-marauders/<file>.png. Выпиши, чего не хватает, и догони
   недостающее: python3 scripts/generate-illustrations-local.py the-marauders --only <id через запятую>

2. Посмотри каждую картинку инструментом Read. Ищи явный брак: пустое поле,
   каша вместо изображения, текст и надписи поверх картинки, лишние конечности,
   грубое несоответствие сцене из промпта. Стиль должен быть единым по всей книге.
   Забракованные перегенерируй с другим сидом: поправь seed у нужной записи в
   prompts.json (добавь поле seed) и запусти
   python3 scripts/generate-illustrations-local.py the-marauders --redo <id>
   Не больше двух попыток на картинку, иначе оставь как есть и отметь в отчёте.

3. Обложка: в lib/reading.ts функция coverUrl() проверяет расширения в порядке
   svg, webp, png — то есть старый public/reading/the-marauders.svg перебивает
   новый PNG. Если PNG-обложка получилась хорошей, переименуй svg:
   mv public/reading/the-marauders.svg public/reading/the-marauders.svg.off
   Если PNG плохой — оставь svg на месте и напиши об этом.

4. Проверь, что читалка реально показывает картинки: подними dev-сервер
   (npm run dev, порт из .claude/launch.json), открой страницу главы
   /reading/the-marauders/3 и убедись, что тег img с картинкой отдаётся.
   Помни правило проекта: npm run build и живой dev-сервер дерутся за .next.

5. Закоммить результат осмысленным сообщением. Пушить не надо.

6. Напиши короткий отчёт в data/reading/illustrations/REPORT.md: сколько картинок
   вышло, что перегенеривал, что осталось кривым, сколько заняло времени."

echo "=== супервизор стартовал $(date +%F\ %T) ===" | tee -a "$LOG"
claude -p "$PROMPT" \
  --model sonnet \
  --permission-mode acceptEdits \
  --allowedTools Read Edit Write Glob Grep TodoWrite \
    "Bash(python3:*)" "Bash(ls:*)" "Bash(cat:*)" "Bash(head:*)" "Bash(tail:*)" \
    "Bash(grep:*)" "Bash(find:*)" "Bash(wc:*)" "Bash(mkdir:*)" "Bash(mv:*)" "Bash(cp:*)" \
    "Bash(git status:*)" "Bash(git diff:*)" "Bash(git log:*)" "Bash(git add:*)" \
    "Bash(git commit:*)" "Bash(git show:*)" "Bash(npm run:*)" "Bash(curl:*)" \
    "Bash(sips:*)" "Bash(file:*)" "Bash(du:*)" "Bash(echo:*)" "Bash(date:*)" \
  --disallowedTools "Bash(git push:*)" "Bash(gh:*)" "Bash(rm:*)" "Bash(sudo:*)" \
    "Bash(ssh:*)" "Bash(launchctl:*)" "Bash(brew:*)" \
  2>&1 | tee -a "$LOG"

echo "=== всё закончено $(date +%F\ %T) ===" | tee -a "$LOG"
