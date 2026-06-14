#!/usr/bin/env bash
# Lint + tests + version alignment + governance report (release gate).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

ydl_is_github_ci() {
  [[ -n "${GITHUB_RUN_ID:-}" || "${CI:-}" == "true" || "${GITHUB_ACTIONS:-}" == "true" ]]
}

bash "$(dirname "$0")/sync-official-image-pins.sh"
bash "$YDL_SCRIPTS/security-secrets-check.sh"
bash "${YDL_REPO_ROOT}/scripts/check-banned-identifiers.sh"
bash "${YDL_REPO_ROOT}/scripts/check-banned-brands.sh"
export YDL_ENFORCE_VENDOR_SYNC="${YDL_ENFORCE_VENDOR_SYNC:-1}"
bash "$(dirname "$0")/check-version-alignment.sh"

# GitHub-hosted runners: fast gate (no multi-minute npm ci). Full gate on prod/release host.
if ydl_is_github_ci; then
  bash "$(dirname "$0")/lint-overlay.sh"
  bash "$(dirname "$0")/test-overlay.sh"
else
  bash "$(dirname "$0")/lint-overlay-full.sh"
  bash "$(dirname "$0")/test-overlay-max.sh"
fi
python3 "$(dirname "$0")/compute-bi-future-gap.py"

python3 "$YDL_SCRIPTS/platform-governance-report.py" --repo-root "$YDL_REPO_ROOT"
REPORT="$(ls -t "$OVERLAY_PLATFORM/reports/governance"/governance-*.md | head -1)"
if grep -q 'overall_status: OK' "$REPORT"; then
  echo "Governance OK — $REPORT"
elif ydl_is_github_ci; then
  echo "Governance ATTENTION (non-blocking in CI — US drift/security need prod host) — $REPORT" >&2
else
  echo "Governance ATTENTION — see $REPORT" >&2
  exit 1
fi
echo "=== quality gate OK ==="
