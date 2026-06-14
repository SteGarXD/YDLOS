#!/usr/bin/env bash
# Smoke: official YDLOS stack (local or BASE_URL).
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1}"
BASE_URL="${BASE_URL%/}"

echo "=== smoke official stack @ ${BASE_URL} ==="

code_ping=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/ping")
echo "GET /ping -> ${code_ping}"
[[ "$code_ping" == "200" ]] || exit 1

code_legacy=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE_URL}/api/v1/legacy-rbac" \
  -H 'Content-Type: application/json' \
  -d '{"action":"t","method":"currentUser","data":[{}]}')
echo "POST /api/v1/legacy-rbac (no cookie) -> ${code_legacy} (401 expected if bridge on)"

code_auth=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/api/auth/signin" -X POST \
  -H 'Content-Type: application/json' \
  -d '{"login":"master","password":"invalid"}' 2>/dev/null || echo "000")
echo "POST /api/auth/signin (via edge) -> ${code_auth} (404 OK if auth only on internal :8080)"

AUTH_SMOKE_URL="${AUTH_SMOKE_URL:-}"
if [[ -n "$AUTH_SMOKE_URL" ]]; then
  code_auth_direct=$(curl -s -o /dev/null -w '%{http_code}' "${AUTH_SMOKE_URL%/}/signin" -X POST \
    -H 'Content-Type: application/json' \
    -d '{"login":"master","password":"invalid"}' 2>/dev/null || echo "000")
  echo "POST ${AUTH_SMOKE_URL}/signin -> ${code_auth_direct}"
fi

echo "=== smoke OK ==="
