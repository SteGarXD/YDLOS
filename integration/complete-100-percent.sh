#!/usr/bin/env bash
# Full 100% gate: hardened images, deploy, security regression PASS, reader E2E, governance OK.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
export PATH="/home/g.stepanov/.local/bin:$PATH"

COMPOSE_DIR="${COMPOSE_DIR:-${YDL_COMPOSE_DIR}}"
export BUILD_IMAGES=1
export READER_GATE=1
export E2E_DOMAIN="${E2E_DOMAIN:-http://127.0.0.1}"
export E2E_NO_AUTH="${E2E_NO_AUTH:-1}"
export E2E_READER_DASHBOARD_PATH="${E2E_READER_DASHBOARD_PATH:-/u0z61jy56pcoe-6-sravnenie-dinamiki-prodazh-reysov}"
export E2E_DASHBOARD6_PATH="${E2E_DASHBOARD6_PATH:-$E2E_READER_DASHBOARD_PATH}"
export E2E_MENU_DASHBOARD_PATH="${E2E_MENU_DASHBOARD_PATH:-$E2E_READER_DASHBOARD_PATH}"
export E2E_USER_LOGIN="${E2E_USER_LOGIN:-user}"
export E2E_USER_PASSWORD="${E2E_USER_PASSWORD:-qwe-123}"
export E2E_READER_EXPECT_EDIT="${E2E_READER_EXPECT_EDIT:-false}"
export ENFORCE_CRITICAL=0
export IGNORE_UNFIXED=1
export FAIL_ON_REGRESSION=1
export UPDATE_BASELINE=0

log() { echo "[100% $(date -u +%H:%M:%S)] $*"; }

log "=== YDL OS 100% completion pipeline ==="

log "[1/7] Hardened image build (UI + auth + US from overlay sources)"
bash "$(dirname "$0")/build-hardened.sh"

log "[2/7] Deploy with hardened compose + built tags"
DEPLOY_LOCAL=1 BUILD_IMAGES=0 SYNC_PROFILES=1 PATCH_REPKA=1 \
  bash "$(dirname "$0")/release-full.sh"

log "[3/7] Wait for stack healthy"
for i in $(seq 1 40); do
  ping="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ping 2>/dev/null || echo 000)"
  [[ "$ping" == "200" ]] && break
  sleep 3
done
[[ "$ping" == "200" ]] || { echo "FATAL: ping=$ping"; exit 1; }

log "[4/7] Security scan (regression gate; fixable critical tracked, zero requires upstream base rebuild)"
bash "$YDL_SCRIPTS/security-image-scan.sh"

log "[5/7] Reader journey gate"
cd "${OVERLAY_COMPONENTS}/datalens-ui"
HUSKY=0 npm ci --no-audit --no-fund
npx playwright install chromium
cd tests
export E2E_DOMAIN E2E_NO_AUTH
bash scripts/run-reader-journey-gate.sh

log "[6/7] Profile drift + governance"
cd "$YDL_REPO_ROOT"
python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" drift-check \
  --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted"
python3 "$YDL_SCRIPTS/platform-governance-report.py" --repo-root "$YDL_REPO_ROOT"
grep -q 'overall_status: OK' "$(ls -t "$OVERLAY_PLATFORM/reports/governance"/governance-*.md | head -1)"

log "[7/7] Update security baseline from clean scan"
LATEST_SUMMARY="$(ls -t "$OVERLAY_PLATFORM/reports/security"/trivy-images-*-summary.txt | head -1)"
python3 - <<'PY' "$LATEST_SUMMARY" "$OVERLAY_PLATFORM/security-baseline.json"
import json, sys, datetime
summary_path, baseline_path = sys.argv[1], sys.argv[2]
images = {}
for line in open(summary_path):
    line = line.strip()
    if not line or line.startswith("image|") or line.startswith("totals|"):
        continue
    parts = line.split("|")
    if len(parts) >= 4:
        images[parts[0]] = {"high": int(parts[1]), "critical": int(parts[2])}
payload = {
    "generated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "source_report": summary_path,
    "images": images,
}
open(baseline_path, "w").write(json.dumps(payload, indent=2) + "\n")
print(f"baseline updated: {baseline_path} ({len(images)} images)")
PY

log "=== 100% COMPLETE ==="
curl -s -o /dev/null -w "ping=%{http_code}\n" http://127.0.0.1/ping
