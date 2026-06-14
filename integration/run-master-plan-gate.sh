#!/usr/bin/env bash
# Master-plan quality gate (phases 0–2 foundation).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

echo "=== YDLOS master-plan gate ==="
bash "$(dirname "$0")/check-version-alignment.sh"
bash "$(dirname "$0")/generate-overlay-inventory.sh"
bash "$(dirname "$0")/overlay-ui-path-inventory.sh"
bash "${YDL_REPO_ROOT}/scripts/check-banned-identifiers.sh"
bash "${YDL_REPO_ROOT}/scripts/check-banned-brands.sh"
bash "$(dirname "$0")/run-platform-quality-gate.sh"
echo "=== master-plan gate OK ==="
