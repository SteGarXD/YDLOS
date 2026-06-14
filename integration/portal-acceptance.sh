#!/usr/bin/env bash
# Portal profile acceptance (OIDC path, no legacy RBAC).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

ENV_FILE="${1:-${OVERLAY_PLATFORM}/.env}"
FAIL=0

check_env() {
  local k="$1" v="$2"
  if grep -q "^${k}=${v}" "$ENV_FILE" 2>/dev/null; then
    echo "OK  ${k}=${v}"
  else
    echo "FAIL ${k} expected ${v} in ${ENV_FILE}" >&2
    FAIL=1
  fi
}

echo "=== Portal acceptance @ ${ENV_FILE} ==="
[[ -f "$ENV_FILE" ]] || { echo "missing $ENV_FILE"; exit 1; }

check_env "ENABLE_LEGACY_PD_RBAC" "0"
check_env "YDL_USE_OFFICIAL_ADMIN" "1"
grep -q "^OIDC=true" "$ENV_FILE" && echo "OK  OIDC=true" || { echo "FAIL OIDC"; FAIL=1; }
grep -q "^EXPORT_WORKBOOK_ENABLED=true" "$ENV_FILE" && echo "OK  export workbook" || true

bash "$(dirname "$0")/platform-acceptance.sh" || FAIL=1

if [[ "$FAIL" -eq 0 ]]; then
  echo "=== portal acceptance OK ==="
else
  echo "=== portal acceptance FAILED ===" >&2
  exit 1
fi
