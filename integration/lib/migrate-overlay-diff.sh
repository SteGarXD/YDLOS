#!/usr/bin/env bash
# Historical: overlay-diff was migrated into modular patches. Bulk trees removed May 2026.
set -euo pipefail
source "$(dirname "$0")/env.sh"
OVERLAY_DIFF="${OVERLAY_ROOT}/patches/datalens-ui/overlay-diff/src"
if [[ ! -d "$OVERLAY_DIFF" ]]; then
  echo "[migrate-overlay-diff] nothing to migrate (overlay-diff absent; bulk trees removed)"
  exit 0
fi
echo "[migrate-overlay-diff] overlay-diff still present — run modular migration manually" >&2
exit 1
