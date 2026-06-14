#!/usr/bin/env bash
# Merge profile features.env into target .env (idempotent keys).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

PROFILE="${YDL_PROFILE:-default}"
[[ "$PROFILE" == "org-private" ]] && PROFILE="private-ext"
TARGET="${1:-${OVERLAY_PLATFORM}/.env}"
PROFILES="${OVERLAY_PLATFORM}/profiles"
BASE="${PROFILES}/default/features.env"
EXTRA="${PROFILES}/${PROFILE}/features.env"

[[ -f "$TARGET" ]] || cp "${OVERLAY_PLATFORM}/.env.example" "$TARGET"

merge_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]] || continue
    local k="${line%%=*}"
    local v="${line#*=}"
    if grep -q "^${k}=" "$TARGET"; then
      sed -i "s|^${k}=.*|${k}=${v}|" "$TARGET"
    else
      echo "${k}=${v}" >>"$TARGET"
    fi
  done <"$f"
}

merge_file "$BASE"
[[ "$PROFILE" != "default" ]] && merge_file "$EXTRA"

echo "OK: profile=${PROFILE} -> ${TARGET}"
