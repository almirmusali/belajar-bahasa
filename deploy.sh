#!/bin/bash
# Обновляет живой сервис Belajar Bahasa на этой же машине (Mac Studio).
#
# Никакого ssh: рабочая копия и запущенный сервис лежат рядом, просто в разных
# папках. Сервис поднят launchd-агентом com.almir.belajar-bahasa из ~/belajar-bahasa
# командой `next start -H 0.0.0.0 8766`, а разработка идёт в ~/Code/belajar-bahasa.
#
# Использование:
#   ./deploy.sh          — синхронизировать, собрать, перезапустить
#   ./deploy.sh --logs   — показать логи сервиса

set -euo pipefail

SRC="$HOME/Code/belajar-bahasa"
LIVE="$HOME/belajar-bahasa"
LABEL="com.almir.belajar-bahasa"
LOG="$HOME/Library/Logs/belajar-bahasa.log"
PORT=8766

show_logs() { tail -n 40 "$LOG" 2>/dev/null || echo "(лога ещё нет: $LOG)"; }

if [[ "${1:-}" == "--logs" ]]; then
    show_logs
    exit 0
fi

echo "→ $SRC  →  $LIVE"

# Бэкап исходников (без node_modules и .next — они восстановятся сборкой).
BK="$LIVE.backup-$(date +%Y%m%d-%H%M%S)"
rsync -a --exclude node_modules --exclude .next "$LIVE/" "$BK/"
echo "✓ бэкап: $BK"

# node_modules не трогаем — он на живой стороне свой и совпадает с package.json.
# .env* исключены намеренно: у живой копии может быть своя конфигурация,
# перезаписать её локальной (где лежит только ключ Voicer) значило бы сломать
# сервис и зря увезти секрет.
rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.env' --exclude '.env.local' --exclude '.env.*.local' \
    --exclude '.audio-tmp' \
    --exclude 'public/audio/_samples' \
    --exclude 'deploy.sh' \
    "$SRC/" "$LIVE/"
echo "✓ файлы синхронизированы"

cd "$LIVE"
rm -rf .next
npm run build

launchctl kickstart -k "gui/$(id -u)/$LABEL"
echo "✓ сервис $LABEL перезапущен"

sleep 3
code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || echo "нет ответа")
echo "→ http://localhost:$PORT/ → $code"
show_logs
