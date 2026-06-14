#!/usr/bin/env bash
# Fail if infra image pins drift from vendor/datalens/versions-config.json
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

bash "$(dirname "$0")/sync-official-image-pins.sh" >/dev/null

VC="${VENDOR_DATALENS}/versions-config.json"
OFFICIAL_ENV="${OVERLAY_PLATFORM}/.official-images.env"
AKR="${OVERLAY_COMPOSE}/compose/deprecated/docker-compose.akrasnov87-images.yaml"
FAIL=0

backend="$(jq -r '.backendVersion' "$VC")"
meta="$(jq -r '.metaManagerVersion' "$VC")"

expect_control="ghcr.io/datalens-tech/datalens-control-api:${backend}"
expect_data="ghcr.io/datalens-tech/datalens-data-api:${backend}"
expect_meta="ghcr.io/datalens-tech/datalens-meta-manager:${meta}"

got_control="$(grep -E '^OFFICIAL_CONTROL_API_IMAGE=' "$OFFICIAL_ENV" | cut -d= -f2-)"
got_data="$(grep -E '^OFFICIAL_DATA_API_IMAGE=' "$OFFICIAL_ENV" | cut -d= -f2-)"
got_meta="$(grep -E '^OFFICIAL_META_MANAGER_IMAGE=' "$OFFICIAL_ENV" | cut -d= -f2-)"

check_pin() {
  local name="$1" want="$2" have="$3"
  if [[ "$want" != "$have" ]]; then
    echo "[align] FAIL $name: want $want have $have" >&2
    FAIL=1
  fi
}
check_pin control-api "$expect_control" "$got_control"
check_pin data-api "$expect_data" "$got_data"
check_pin meta-manager "$expect_meta" "$got_meta"

if grep -q 'akrasnov87/datalens-control-api:0.2396' "$AKR" 2>/dev/null; then
  echo "[align] WARN akrasnov87-images.yaml still pins old control-api 0.2396 (use official-images overlay in deploy)" >&2
fi

head_sha="$(git -C "$YDL_REPO_ROOT" rev-parse --short=12 HEAD)"
if [[ -f "${OVERLAY_PLATFORM}/.ydl-built-images.env" ]]; then
  # shellcheck disable=SC1090
  source "${OVERLAY_PLATFORM}/.ydl-built-images.env"
  if [[ "${YDL_BUILD_SHA:-}" != "$head_sha" ]]; then
    echo "[align] WARN YDL_BUILD_SHA ${YDL_BUILD_SHA:-none} != HEAD $head_sha (run integration/build.sh before prod deploy)" >&2
    if [[ "${YDL_ENFORCE_BUILD_SHA:-0}" == "1" ]]; then
      echo "[align] FAIL strict build-sha enforcement enabled" >&2
      FAIL=1
    fi
  else
    echo "[align] OK overlay images built for HEAD ${YDL_BUILD_SHA}"
  fi
else
  echo "[align] WARN missing .ydl-built-images.env (run integration/build.sh)" >&2
fi

vendor_behind=0
if [[ -d "${VENDOR_DATALENS}/.git" ]]; then
  git -C "$VENDOR_DATALENS" fetch -q https://github.com/datalens-tech/datalens.git main 2>/dev/null || true
  read -r vendor_behind _rest < <(git -C "$VENDOR_DATALENS" rev-list --left-right --count FETCH_HEAD...HEAD 2>/dev/null || echo "0 0")
fi
echo "[align] vendor/datalens vs datalens-tech/main: behind=${vendor_behind} (0 = platform не отстаёт)"
if [[ "${vendor_behind:-0}" -gt 0 ]]; then
  echo "[align] FAIL vendor submodule behind datalens-tech/main by ${vendor_behind} commit(s). Run: bash integration/update-vendor.sh main" >&2
  FAIL=1
fi

# GitHub fork banner compares YDLOS *root* to datalens-tech/datalens — not the submodule.
root_behind=0
root_ahead=0
if git fetch -q https://github.com/datalens-tech/datalens.git main:refs/remotes/ydl-upstream/main 2>/dev/null; then
  read -r root_behind root_ahead < <(git rev-list --left-right --count ydl-upstream/main...HEAD 2>/dev/null || echo "0 0")
fi
echo "[align] YDLOS root vs datalens-tech/main (GitHub fork UI): behind=${root_behind} ahead=${root_ahead}"
if [[ "${root_behind:-0}" -gt 0 ]]; then
  echo "[align] NOTE root behind=${root_behind} — история корня YDLOS ≠ vendor submodule (норма). См. docs/dev/github-fork-vs-vendor.md" >&2
  if [[ "${YDL_ENFORCE_ROOT_SYNC:-0}" == "1" ]]; then
    echo "[align] FAIL YDL_ENFORCE_ROOT_SYNC=1 — merge upstream in root or Leave fork network" >&2
    FAIL=1
  fi
fi
us_overlay="$(jq -r .version "${OVERLAY_COMPONENTS}/datalens-us/package.json" 2>/dev/null || echo n/a)"
us_vendor="$(jq -r .usVersion "$VC")"
echo "[align] overlay US ${us_overlay} / vendor usVersion ${us_vendor}"
if [[ "$us_overlay" != "$us_vendor" && "${YDL_LEGACY_AUTH:-0}" != "1" ]]; then
  echo "[align] WARN overlay US version != vendor (run integration/rebase-us-from-upstream.sh)" >&2
fi

[[ "$FAIL" -eq 0 ]] || exit 1
echo "[align] OK infra pins match vendor"
