#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/ydl-os-dev-lib.sh
source "$SCRIPT_DIR/lib/ydl-os-dev-lib.sh"

echo "=== YDL OS dev status ==="
if [[ -f "$STAMP_FILE" ]]; then
  cat "$STAMP_FILE"
else
  echo "(no stamp — dev not started via dev-start.sh)"
fi
echo ""
echo "Ports (dev-local, 127.0.0.1):"
ss -tlnp 2>/dev/null | grep -E ':5432|:7233|:8030|:8088|:8010|:8020|:3040|:3050|:80 |:8080|:3030 ' || echo "  (none)"
if ss -tln 2>/dev/null | grep -qE '127\.0\.0\.1:5432 '; then
  echo "  Postgres :5432 — OK (python3 fix-repka-*.py с хоста)"
else
  echo "  Postgres :5432 — нет проброса; перезапустите: bash $SCRIPT_DIR/dev-start.sh"
fi
echo ""
echo "Health:"
curl -sf -o /dev/null -w "  US :8030/ping → %{http_code}\n" http://127.0.0.1:8030/ping 2>/dev/null || echo "  US :8030 → down"
curl -sf -o /dev/null -w "  UI :8080/ping → %{http_code}\n" http://127.0.0.1:8080/ping 2>/dev/null || echo "  UI :8080 → down"
curl -sf -o /dev/null -w "  nginx /ping → %{http_code}\n" http://127.0.0.1/ping 2>/dev/null || echo "  nginx :80 → down"
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "  UI process: pid=$(cat "$PID_FILE") running"
else
  echo "  UI process: not running"
fi
