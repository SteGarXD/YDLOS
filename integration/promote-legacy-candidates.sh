#!/usr/bin/env bash
# Promote overlay/patches/datalens-ui/<module>/legacy-candidates/* → <module>/src/*
# Usage: promote-legacy-candidates.sh [module ...]   (default: all modules with candidates)
set -euo pipefail
source "$(dirname "$0")/lib/env.sh"

PATCH="${OVERLAY_ROOT}/patches/datalens-ui"
MODULES=("$@")

if [[ ${#MODULES[@]} -eq 0 ]]; then
  for d in "${PATCH}"/*/legacy-candidates; do
    [[ -d "$d" ]] || continue
    name="$(basename "$(dirname "$d")")"
    [[ "$name" == "legacy-resolved" ]] && continue
    MODULES+=("$name")
  done
fi

promote_module() {
  local mod="$1"
  local cand="${PATCH}/${mod}/legacy-candidates"
  local dst="${PATCH}/${mod}/src"
  if [[ ! -d "$cand" ]]; then
    echo "[promote] skip ${mod}: no legacy-candidates"
    return 0
  fi
  local count
  count="$(find "$cand" -type f | wc -l)"
  [[ "$count" -gt 0 ]] || { echo "[promote] skip ${mod}: empty"; return 0; }
  echo "[promote] ${mod}: ${count} files → src/"
  mkdir -p "$dst"
  rsync -a "${cand}/" "${dst}/"
  echo "[promote] ${mod}: done"
}

for mod in "${MODULES[@]}"; do
  promote_module "$mod"
done

echo "[promote] Run: YDL_UI_CLIENT_BUILD=1 bash integration/build.sh"
