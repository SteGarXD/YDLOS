#!/usr/bin/env bash
# Sync portal dashboard ACL matrix: validate users + entries, emit apply plan.
# OSS US: per-entry ACL via Share UI (DLS stub). Script = gate + checklist for ops.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
# shellcheck source=integration/lib/auth-db.sh
source "$(dirname "$0")/lib/auth-db.sh"
# shellcheck source=integration/lib/us-api.sh
source "$(dirname "$0")/lib/us-api.sh"

MAPPING_FILE="${MAPPING_FILE:-}"
DRY_RUN="${DRY_RUN:-1}"
US_URL="${US_URL:-http://127.0.0.1:8083}"
OUTPUT="${OUTPUT:-}"
FAIL=0

log() { echo "[sync-us-permissions] $*"; }

usage() {
  cat <<EOF
Sync US dashboard read matrix (portal).

  MAPPING_FILE=examples/portal/dashboard-mapping.csv \\
  US_MASTER_TOKEN=... US_URL=http://127.0.0.1:8083 \\
  PG_CONTAINER=datalens-postgres-prod \\
  bash integration/sync-us-permissions.sh

CSV columns:
  user_login,dashboard_entry_id
  airline_id,dashboard_entry_id   (requires AIRLINE_USERS_CSV)

Env:
  DRY_RUN=1     validate only (default)
  DRY_RUN=0     write OUTPUT checklist for manual Share UI (auto-ACL API pending upstream DLS)
  OUTPUT=file   save checklist

See docs/dev/dostup-kontenta.md
EOF
}

resolve_airline_users() {
  local airline="$1"
  local map="${AIRLINE_USERS_CSV:-}"
  [[ -f "$map" ]] || return 1
  awk -F',' -v a="$airline" 'NR>1 && $1==a {print $2}' "$map"
}

if [[ -z "$MAPPING_FILE" || ! -f "$MAPPING_FILE" ]]; then
  usage
  exit 1
fi

if [[ -z "${US_MASTER_TOKEN:-}" ]]; then
  log "ERROR: US_MASTER_TOKEN required" >&2
  exit 1
fi

emit() {
  if [[ -n "$OUTPUT" ]]; then
    echo "$*" >>"$OUTPUT"
  else
    echo "$*"
  fi
}

[[ -n "$OUTPUT" ]] && : >"$OUTPUT"

log "US_URL=$US_URL DRY_RUN=$DRY_RUN file=$MAPPING_FILE"
count=0
ok=0

while IFS=',' read -r col1 col2 extra; do
  col1="${col1//$'\r'/}"
  col2="${col2//$'\r'/}"
  [[ "$col1" == "user_login" || "$col1" == "airline_id" ]] && continue
  [[ -z "$col1" || -z "$col2" ]] && continue
  [[ -n "$extra" ]] && log "WARN: extra columns ignored on line: $col1,$col2"

  subjects=()
  if [[ "$col1" =~ ^[0-9a-fA-F-]{36}$ ]]; then
    subjects+=("$col1")
  elif [[ "$col1" =~ @ ]]; then
    uid="$(auth_user_id_by_login "$col1" | tr -d '[:space:]')"
    [[ -n "$uid" ]] || { log "FAIL unknown login: $col1"; FAIL=1; count=$((count + 1)); continue; }
    subjects+=("$uid")
  else
    while read -r login; do
      [[ -n "$login" ]] && subjects+=("$login")
    done < <(resolve_airline_users "$col1" || true)
    if [[ ${#subjects[@]} -eq 0 ]]; then
      log "FAIL airline $col1: no users (set AIRLINE_USERS_CSV)"
      FAIL=1
      count=$((count + 1))
      continue
    fi
    resolved=()
    for login in "${subjects[@]}"; do
      uid="$(auth_user_id_by_login "$login" | tr -d '[:space:]')"
      [[ -n "$uid" ]] && resolved+=("$uid") || log "WARN skip login $login"
    done
    subjects=("${resolved[@]}")
  fi

  if ! us_entry_exists "$col2"; then
    log "FAIL entry not found in US: $col2"
    FAIL=1
    count=$((count + 1))
    continue
  fi

  for uid in "${subjects[@]}"; do
    log "OK  grant read: user=$uid -> dashboard=$col2"
    emit "MANUAL_SHARE_UI|user_id=${uid}|entry_id=${col2}|permission=read"
    ok=$((ok + 1))
  done
  count=$((count + 1))
done <"$MAPPING_FILE"

log "rows=$count bindings_ok=$ok fail=$FAIL"

if [[ "$DRY_RUN" == "0" ]]; then
  log "Apply: open each dashboard in BI → Доступ → добавить пользователя (read)."
  log "Automated US ACL API blocked until DLS enabled in US (see docs/dev/dostup-kontenta.md § OSS)."
  [[ -n "$OUTPUT" ]] && log "Checklist: $OUTPUT"
fi

exit "$FAIL"
