#!/usr/bin/env bash
# YDL OS integration environment (single source of paths).
set -euo pipefail

if [[ -z "${YDL_REPO_ROOT:-}" ]]; then
  _INTEGRATION_LIB="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  YDL_REPO_ROOT="$(cd "${_INTEGRATION_LIB}/../.." && pwd)"
fi

export YDL_REPO_ROOT
export VENDOR_DATALENS="${YDL_REPO_ROOT}/vendor/datalens"
export OVERLAY_ROOT="${YDL_REPO_ROOT}/overlay"
export OVERLAY_PLATFORM="${OVERLAY_ROOT}/platform"
export OVERLAY_COMPONENTS="${OVERLAY_ROOT}/components"
export OVERLAY_INFRA="${OVERLAY_ROOT}/infra"
export OVERLAY_COMPOSE="${OVERLAY_PLATFORM}/compose"
export YDL_SCRIPTS="${OVERLAY_PLATFORM}/scripts/ydl-os"

vendor_versions() {
  if [[ -f "${VENDOR_DATALENS}/versions-config.json" ]]; then
    cat "${VENDOR_DATALENS}/versions-config.json"
  fi
}
