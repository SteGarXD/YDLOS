#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/nightly-maintenance.sh"
CRON_MARKER="# ydl-os nightly maintenance"
CRON_LINE="17 2 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash $SCRIPT >> /home/g.stepanov/datalens/datalens/reports/nightly/cron.log 2>&1"

mkdir -p "$REPO_ROOT/datalens/reports/nightly"
chmod +x "$SCRIPT"

TMP="$(mktemp)"
crontab -l 2>/dev/null > "$TMP" || true

if grep -Fq "$CRON_MARKER" "$TMP"; then
  echo "Nightly cron entry already exists."
else
  {
    echo "$CRON_MARKER"
    echo "$CRON_LINE"
  } >> "$TMP"
  crontab "$TMP"
  echo "Nightly cron entry installed."
fi

rm -f "$TMP"
crontab -l
