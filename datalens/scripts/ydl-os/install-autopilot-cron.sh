#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh"
CRON_MARKER="# ydl-os autopilot sync-build-smoke-deploy"
CRON_LINE="47 3 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin AUTO_PUSH=1 FORCE_REDEPLOY=1 SECURITY_GATE=1 bash $SCRIPT >> /home/g.stepanov/datalens/datalens/reports/autopilot/cron.log 2>&1"

mkdir -p "$REPO_ROOT/datalens/reports/autopilot"
chmod +x "$SCRIPT"

TMP="$(mktemp)"
crontab -l 2>/dev/null > "$TMP" || true

TMP_CLEAN="$(mktemp)"
grep -vF "$CRON_MARKER" "$TMP" | grep -vF "$SCRIPT" > "$TMP_CLEAN" || true
mv "$TMP_CLEAN" "$TMP"
{
  echo "$CRON_MARKER"
  echo "$CRON_LINE"
} >> "$TMP"
crontab "$TMP"
echo "Autopilot cron entry configured."

rm -f "$TMP"
crontab -l
