#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/nightly-maintenance.sh"
AUTOPILOT_SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh"
SECURITY_SCAN_SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/security-image-scan.sh"
CRON_MARKER="# ydl-os nightly maintenance"
CRON_LINE="17 2 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash $SCRIPT >> /home/g.stepanov/datalens/datalens/reports/nightly/cron.log 2>&1"
AUTOPILOT_MARKER="# ydl-os autopilot sync-build-smoke-deploy"
AUTOPILOT_LINE="47 3 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin AUTO_PUSH=1 FORCE_REDEPLOY=1 bash $AUTOPILOT_SCRIPT >> /home/g.stepanov/datalens/datalens/reports/autopilot/cron.log 2>&1"
SECURITY_SCAN_MARKER="# ydl-os weekly security image scan"
SECURITY_SCAN_LINE="23 4 * * 0 PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash $SECURITY_SCAN_SCRIPT >> /home/g.stepanov/datalens/datalens/reports/security/cron.log 2>&1"

mkdir -p "$REPO_ROOT/datalens/reports/nightly"
mkdir -p "$REPO_ROOT/datalens/reports/autopilot"
mkdir -p "$REPO_ROOT/datalens/reports/security"
chmod +x "$SCRIPT"
chmod +x "$AUTOPILOT_SCRIPT"
chmod +x "$SECURITY_SCAN_SCRIPT"

TMP="$(mktemp)"
crontab -l 2>/dev/null > "$TMP" || true

if ! grep -Fq "$CRON_MARKER" "$TMP"; then
  {
    echo "$CRON_MARKER"
    echo "$CRON_LINE"
  } >> "$TMP"
fi

if ! grep -Fq "$AUTOPILOT_MARKER" "$TMP"; then
  {
    echo "$AUTOPILOT_MARKER"
    echo "$AUTOPILOT_LINE"
  } >> "$TMP"
fi

if ! grep -Fq "$SECURITY_SCAN_MARKER" "$TMP"; then
  {
    echo "$SECURITY_SCAN_MARKER"
    echo "$SECURITY_SCAN_LINE"
  } >> "$TMP"
fi

if ! crontab "$TMP"; then
  echo "Failed to install cron entries"
  rm -f "$TMP"
  exit 1
fi

echo "Nightly and autopilot cron entries are configured."

rm -f "$TMP"
crontab -l
