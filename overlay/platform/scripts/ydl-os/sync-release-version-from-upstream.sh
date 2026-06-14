#!/usr/bin/env bash
# Синхронизирует RELEASE_VERSION / releaseVersion с datalens-tech/datalens (upstream).
# Вызывается из dev-ui-start, redeploy, autopilot, nightly, sync-platform-upstream.
#
# Env:
#   REPO_ROOT          — корень монорепо (default: auto)
#   UPSTREAM_REF       — ref upstream (default: upstream/main)
#   FETCH_UPSTREAM=1   — git fetch upstream перед чтением
#   COMPOSE_DIR        — ${YDL_COMPOSE_DIR}/.env (optional)
#   UI_DEV_ENV         — components/datalens-ui/.env (optional)
#   APPLY_VERSIONS_JSON=1 — обновить datalens/versions-config.json (default: 1)
#
# Exit: 0 — версия определена; 1 — не удалось прочитать upstream.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INNER_DATALENS="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="${REPO_ROOT:-$(cd "$SCRIPT_DIR/../../../.." && pwd)}"
UPSTREAM_REF="${UPSTREAM_REF:-upstream/main}"
FETCH_UPSTREAM="${FETCH_UPSTREAM:-1}"
COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
UI_DEV_ENV="${UI_DEV_ENV:-$REPO_ROOT/overlay/components/datalens-ui/.env}"
VERSIONS_JSON="${VERSIONS_JSON:-$INNER_DATALENS/versions-config.json}"
VENDOR_VERSIONS="${VENDOR_VERSIONS:-$REPO_ROOT/vendor/datalens/versions-config.json}"
APPLY_VERSIONS_JSON="${APPLY_VERSIONS_JSON:-1}"
STAMP_FILE="${STAMP_FILE:-$INNER_DATALENS/reports/release-version-sync.stamp}"

log() {
  # Только stderr: этот скрипт часто вызывают как RELEASE_VERSION="$(bash …)" — лог в stdout ломает .env и favicon.
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" >&2
}

read_upstream_release_version() {
  local path ref raw
  if [[ -f "$VENDOR_VERSIONS" ]]; then
    raw="$(cat "$VENDOR_VERSIONS")"
  else
    for path in versions-config.json datalens/versions-config.json; do
      if raw="$(git -C "$REPO_ROOT" show "${UPSTREAM_REF}:${path}" 2>/dev/null)"; then
        ref="$path"
        break
      fi
    done
  fi
  if [[ -z "${raw:-}" ]]; then
    return 1
  fi
  python3 - <<'PY' "$raw"
import json, re, sys
raw = sys.argv[1]
try:
    data = json.loads(raw)
except json.JSONDecodeError:
    m = re.search(r'"releaseVersion"\s*:\s*"([^"]+)"', raw)
    if not m:
        sys.exit(2)
    print(m.group(1))
    sys.exit(0)
v = data.get("releaseVersion")
if not v or not isinstance(v, str):
    sys.exit(2)
print(v.strip())
PY
}

mkdir -p "$(dirname "$STAMP_FILE")"

if [[ "$FETCH_UPSTREAM" == "1" ]]; then
  set +e
  git -C "$REPO_ROOT" fetch upstream --prune >/dev/null 2>&1
  set -e
fi

if ! NEW_VER="$(read_upstream_release_version)"; then
  log "ERROR: cannot read releaseVersion from $UPSTREAM_REF"
  exit 1
fi

OLD_VER=""
if [[ -f "$VERSIONS_JSON" ]]; then
  OLD_VER="$(python3 - <<'PY' "$VERSIONS_JSON"
import json, sys
try:
    print(json.load(open(sys.argv[1])).get("releaseVersion", ""))
except Exception:
    print("")
PY
)"
fi

CHANGED=0
if [[ "$OLD_VER" != "$NEW_VER" ]]; then
  CHANGED=1
fi

if [[ "$APPLY_VERSIONS_JSON" == "1" && -f "$VERSIONS_JSON" ]]; then
  python3 - <<'PY' "$VERSIONS_JSON" "$NEW_VER"
import json, sys
path, ver = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
data["releaseVersion"] = ver
with open(path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)
    f.write("\n")
PY
fi

patch_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  if grep -q '^RELEASE_VERSION=' "$file"; then
    sed -i "s/^RELEASE_VERSION=.*/RELEASE_VERSION=$NEW_VER/" "$file"
  else
    echo "RELEASE_VERSION=$NEW_VER" >>"$file"
  fi
}

patch_env_file "$COMPOSE_DIR/.env"
patch_env_file "$UI_DEV_ENV"

export RELEASE_VERSION="$NEW_VER"

{
  echo "synced_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "upstream_ref=$UPSTREAM_REF"
  echo "release_version=$NEW_VER"
  echo "previous_versions_json=$OLD_VER"
  echo "changed=$CHANGED"
} >"$STAMP_FILE"

if [[ "$CHANGED" == "1" ]]; then
  log "release version updated: ${OLD_VER:-<none>} -> $NEW_VER (upstream)"
else
  log "release version already current: $NEW_VER (upstream)"
fi

echo "$NEW_VER"
