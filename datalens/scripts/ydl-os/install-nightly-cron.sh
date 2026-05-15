#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/nightly-maintenance.sh"
AUTOPILOT_SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh"
SECURITY_SCAN_SCRIPT="$REPO_ROOT/datalens/scripts/ydl-os/security-image-scan.sh"
CRON_MARKER="# ydl-os nightly maintenance"
CRON_LINE="17 2 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash $SCRIPT >> /home/g.stepanov/datalens/datalens/reports/nightly/cron.log 2>&1"
AUTOPILOT_MARKER="# ydl-os autopilot sync-build-smoke-deploy"
AUTOPILOT_LINE="47 3 * * * PATH=/home/g.stepanov/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin AUTO_PUSH=1 FORCE_REDEPLOY=1 SECURITY_GATE=1 bash $AUTOPILOT_SCRIPT >> /home/g.stepanov/datalens/datalens/reports/autopilot/cron.log 2>&1"
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

TMP_CLEAN="$(mktemp)"
grep -vF "$CRON_MARKER" "$TMP" \
  | grep -vF "$AUTOPILOT_MARKER" \
  | grep -vF "$SECURITY_SCAN_MARKER" \
  | grep -vF "$SCRIPT" \
  | grep -vF "$AUTOPILOT_SCRIPT" \
  | grep -vF "$SECURITY_SCAN_SCRIPT" > "$TMP_CLEAN" || true
mv "$TMP_CLEAN" "$TMP"

{
  echo "$CRON_MARKER"
  echo "$CRON_LINE"
  echo "$AUTOPILOT_MARKER"
  echo "$AUTOPILOT_LINE"
  echo "$SECURITY_SCAN_MARKER"
  echo "$SECURITY_SCAN_LINE"
} >> "$TMP"

if ! crontab "$TMP"; then
  echo "Failed to install cron entries"
  rm -f "$TMP"
  exit 1
fi

echo "Nightly and autopilot cron entries are configured."

rm -f "$TMP"
crontab -l
