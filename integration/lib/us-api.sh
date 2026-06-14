#!/usr/bin/env bash
# United Storage HTTP helpers (master token).
set -euo pipefail

US_MASTER_TOKEN_HEADER="${US_MASTER_TOKEN_HEADER:-x-us-master-token}"

us_curl() {
  local method="${1:-GET}"
  local path="$2"
  shift 2
  local url="${US_URL%/}${path}"
  curl -fsS -X "$method" "$url" \
    -H "${US_MASTER_TOKEN_HEADER}: ${US_MASTER_TOKEN}" \
    -H 'Content-Type: application/json' \
    "$@"
}

us_entry_exists() {
  local entry_id="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' \
    -H "${US_MASTER_TOKEN_HEADER}: ${US_MASTER_TOKEN}" \
    "${US_URL%/}/v1/private/entries/${entry_id}/meta" || echo 000)"
  [[ "$code" == "200" ]]
}
