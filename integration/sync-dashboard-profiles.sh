#!/usr/bin/env bash
# Sync DashboardProfile JSON from Git into US dash entry revisions.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

PROFILES_DIR="${PROFILES_DIR:-${OVERLAY_PLATFORM}/profiles/extracted}"
ENGINE="${OVERLAY_PLATFORM}/scripts/ydl-os/dashboard-profile-engine.py"

DRY=1
APPLY=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1; DRY=0 ;;
    --dry-run) DRY=1; APPLY=0 ;;
  esac
done

if [[ ! -d "$PROFILES_DIR" ]]; then
  echo "Profiles dir not found: $PROFILES_DIR" >&2
  exit 1
fi

echo "=== DashboardProfile sync ==="
echo "profiles: ${PROFILES_DIR}"

# Host postgres publish (compose host-ports: 127.0.0.1:5432)
if [[ -z "${PGHOST:-}" ]] && [[ "${POSTGRES_HOST:-postgres}" == "postgres" ]]; then
  if ss -ltn 2>/dev/null | grep -q ':5432 '; then
    export PGHOST=127.0.0.1
    export PGPORT=5432
  elif ss -ltn 2>/dev/null | grep -q ':5433 '; then
    export PGHOST=127.0.0.1
    export PGPORT=5433
  fi
fi

python3 "$ENGINE" validate --profiles-dir "$PROFILES_DIR"

if [[ "$APPLY" == "1" ]]; then
  python3 "$ENGINE" sync --profiles-dir "$PROFILES_DIR" --apply
else
  python3 "$ENGINE" sync --profiles-dir "$PROFILES_DIR"
  echo "(dry-run — pass --apply to write US)"
fi
