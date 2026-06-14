#!/usr/bin/env bash
# Run docker compose: official vendor base + YDL overlay files only.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

bash "$(dirname "$0")/verify-vendor-pristine.sh" >/dev/null

bash "$(dirname "$0")/sync-official-image-pins.sh" >/dev/null 2>&1 || true
if [[ -f "${OVERLAY_PLATFORM}/.official-images.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "${OVERLAY_PLATFORM}/.official-images.env" && set +a
fi

if [[ -f "${OVERLAY_PLATFORM}/.ydl-built-images.env" ]]; then
  # shellcheck disable=SC1090
  set -a && source "${OVERLAY_PLATFORM}/.ydl-built-images.env" && set +a
fi

mapfile -t COMPOSE_FILES < <(
  # shellcheck disable=SC1091
  source "${YDL_REPO_ROOT}/integration/lib/compose-files.sh"
  ydl_compose_files "${YDL_REPO_ROOT}" "${OVERLAY_PLATFORM}"
)

export COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-ydl-os}"
export APP_ENV="${APP_ENV:-production}"

cd "${OVERLAY_PLATFORM}"
exec docker compose "${COMPOSE_FILES[@]}" "$@"
