#!/usr/bin/env bash
# Platform acceptance: official stack + YDL feature flags + akrasnov parity smoke.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_URL="${BASE_URL%/}"
AUTH_URL="${AUTH_SMOKE_URL:-http://127.0.0.1:8081}"
FAIL=0

check() {
  local name="$1" expect="$2" got="$3"
  if [[ "$got" == "$expect" ]]; then
    echo "OK  ${name} -> ${got}"
  else
    echo "FAIL ${name} -> ${got} (expected ${expect})" >&2
    FAIL=1
  fi
}

echo "=== YDLOS platform acceptance @ ${BASE_URL} ==="

bash "${YDL_REPO_ROOT}/scripts/check-banned-identifiers.sh"
bash "${YDL_REPO_ROOT}/scripts/check-banned-brands.sh"
bash "$(dirname "$0")/check-version-alignment.sh" || true

bash "$(dirname "$0")/smoke-official-stack.sh"

code_ping=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/ping")
check "GET /ping" "200" "$code_ping"

code_settings=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/settings")
check "GET /settings" "200" "$code_settings"

code_legacy=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE_URL}/api/v1/legacy-rbac" \
  -H 'Content-Type: application/json' -d '{"action":"t","method":"currentUser","data":[{}]}')
if [[ "${ENABLE_LEGACY_PD_RBAC:-0}" == "1" ]]; then
  [[ "$code_legacy" == "401" || "$code_legacy" == "200" ]] && echo "OK  legacy-rbac bridge on -> ${code_legacy}" || { echo "FAIL legacy-rbac ${code_legacy}"; FAIL=1; }
else
  check "POST legacy-rbac (off)" "404" "$code_legacy"
fi

code_signin=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${AUTH_URL%/}/signin" \
  -H 'Content-Type: application/json' \
  -d '{"login":"master","password":"invalid"}' 2>/dev/null || echo "000")
[[ "$code_signin" == "401" || "$code_signin" == "400" || "$code_signin" == "403" ]] \
  && echo "OK  auth signin rejects bad password -> ${code_signin}" \
  || { echo "WARN auth signin -> ${code_signin} (check AUTH_SMOKE_URL)"; }

if [[ -f "${OVERLAY_PLATFORM}/docs/overlay-inventory.md" ]]; then
  echo "OK  overlay-inventory.md present"
else
  echo "FAIL overlay-inventory.md missing" >&2
  FAIL=1
fi

if [[ -f "${YDL_REPO_ROOT}/docs/dev/feature-registry.md" ]]; then
  echo "OK  feature-registry.md present"
else
  echo "FAIL feature-registry.md missing" >&2
  FAIL=1
fi

if [[ "$FAIL" -eq 0 ]]; then
  echo "=== platform acceptance OK ==="
else
  echo "=== platform acceptance FAILED ===" >&2
  exit 1
fi
