#!/bin/bash
# Обновляет живой сервис Belajar Bahasa на Mac Studio.
#
# Копия одна: launchd-агент com.almir.belajar-bahasa поднимает `next start`
# прямо из этой папки (см. WorkingDirectory в plist). Раньше рядом жила вторая,
# «живая» копия в ~/belajar-bahasa, и deploy.sh синхронизировал её через rsync —
# но агент её не читал, так что обновлялась папка, которую никто не отдаёт,
# а вместе с ней копились бэкапы на семь гигабайт. Копию убрали 27.08.2026.
#
# Отсюда и главное правило: картинки и прочая статика из public/ отдаются с диска
# и видны сразу, а страницы книг статические (dynamicParams = false) — новые
# иллюстрации и обложки появляются на сайте только после пересборки.
#
# Использование:
#   ./deploy.sh          — собрать и перезапустить
#   ./deploy.sh --logs   — показать логи сервиса

set -euo pipefail

APP="$HOME/Code/belajar-bahasa"
LABEL="com.almir.belajar-bahasa"
LOG="$HOME/Library/Logs/belajar-bahasa.log"
PORT=8766

show_logs() { tail -n 40 "$LOG" 2>/dev/null || echo "(лога ещё нет: $LOG)"; }

if [[ "${1:-}" == "--logs" ]]; then
    show_logs
    exit 0
fi

cd "$APP"

# .env.local в git не уходит и живёт только здесь — без него сервис теряет
# аналитику читалки и админку, поэтому проверяем до сборки, а не после.
for key in SUPABASE_SERVICE_ROLE_KEY ADMIN_EMAILS; do
    grep -qE "^${key}=." .env.local 2>/dev/null \
        || echo "! в .env.local нет $key — /admin и аналитика работать не будут"
done

echo "→ сборка в $APP"
rm -rf .next
npm run build

launchctl kickstart -k "gui/$(id -u)/$LABEL"
echo "✓ сервис $LABEL перезапущен"

sleep 4
code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || echo "нет ответа")
echo "→ http://localhost:$PORT/ → $code"
show_logs
