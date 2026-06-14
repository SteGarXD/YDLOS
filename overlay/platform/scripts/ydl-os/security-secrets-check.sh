#!/usr/bin/env bash
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
YDL_REPO_ROOT="${YDL_REPO_ROOT:-$(cd "${_SCRIPT_DIR}/../../../.." && pwd)}"
REPO_ROOT="${REPO_ROOT:-$YDL_REPO_ROOT}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/overlay/platform/reports/security}"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/secret-scan-${TS}.txt"

mkdir -p "$REPORT_DIR"

echo "[secret-scan] started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$REPORT_FILE"
echo "[secret-scan] scope=overlay/components,overlay/platform/scripts,integration (no vendor, no compose yaml)" | tee -a "$REPORT_FILE"

cd "$REPO_ROOT"

PATTERN='(AKIA[0-9A-Z]{16}|-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----|xox[baprs]-[A-Za-z0-9-]{10,}|ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z\\-_]{35})'
GLOBS=(
  -g 'overlay/components/**'
  -g 'overlay/platform/scripts/**'
  -g 'integration/**'
  -g '!vendor/**'
  -g '!**/node_modules/**'
  -g '!**/dist/**'
  -g '!**/reports/**'
  -g '!**/*.sql'
  -g '!**/docker-compose*.yaml'
  -g '!**/*.md'
)

set +e
if command -v rg >/dev/null 2>&1; then
  MATCHES="$(rg -n --hidden -S "${GLOBS[@]}" -e "$PATTERN" . 2>/dev/null || true)"
else
  MATCHES="$(grep -RInE --include='*.py' --include='*.js' --include='*.ts' --include='*.env' \
    --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=vendor \
    "$PATTERN" overlay/components overlay/platform/scripts integration 2>/dev/null || true)"
fi
set -e

if [[ -n "${MATCHES//[$'\n']/}" ]]; then
  echo "[secret-scan] potential secrets detected:" | tee -a "$REPORT_FILE"
  echo "$MATCHES" | tee -a "$REPORT_FILE"
  exit 3
fi

echo "[secret-scan] no potential leaked secrets in application code" | tee -a "$REPORT_FILE"
