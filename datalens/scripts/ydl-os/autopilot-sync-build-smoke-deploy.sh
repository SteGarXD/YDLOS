#!/usr/bin/env bash
set -euo pipefail
export PATH="/home/g.stepanov/.local/bin:$PATH"

# Autopilot cycle:
# 1) sync report against upstream
# 2) keep github/main at 0 behind (snapshot commit on top of upstream/main)
# 3) build + smoke + deploy from github/main
# 4) vulnerability scan with regression gate

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/autopilot}"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/autopilot-${TS}.log"
AUTO_PUSH="${AUTO_PUSH:-1}"
FORCE_REDEPLOY="${FORCE_REDEPLOY:-0}"
SECURITY_GATE="${SECURITY_GATE:-1}"

mkdir -p "$REPORT_DIR"
cd "$REPO_ROOT"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$REPORT_FILE"
}

log "autopilot started"
log "repo_root=$REPO_ROOT"

git fetch upstream --prune | tee -a "$REPORT_FILE"
git fetch github --prune | tee -a "$REPORT_FILE"

BEHIND_AHEAD="$(git rev-list --left-right --count upstream/main...github/main)"
BEHIND="$(echo "$BEHIND_AHEAD" | awk '{print $1}')"
AHEAD="$(echo "$BEHIND_AHEAD" | awk '{print $2}')"
log "divergence upstream/main...github/main behind=$BEHIND ahead=$AHEAD"

# Build latest analytical sync report as an artifact.
bash "$REPO_ROOT/datalens/scripts/ydl-os/sync-platform-upstream.sh" | tee -a "$REPORT_FILE" || true

UPDATED_GITHUB=0
if [[ "$BEHIND" -gt 0 ]]; then
  if [[ "$AUTO_PUSH" != "1" ]]; then
    log "github/main is behind, but AUTO_PUSH=0 so snapshot push skipped"
  else
    TREE_SHA="$(git rev-parse github/main^{tree})"
    SNAP_MSG="sync: snapshot github tree on upstream main (${TS})"
    SNAP_COMMIT="$(git commit-tree "$TREE_SHA" -p upstream/main -m "$SNAP_MSG")"
    git push --force-with-lease github "$SNAP_COMMIT":main | tee -a "$REPORT_FILE"
    UPDATED_GITHUB=1
    log "github/main updated to snapshot commit $SNAP_COMMIT"
  fi
else
  log "github/main is not behind upstream; snapshot update not required"
fi

if [[ "$UPDATED_GITHUB" -eq 1 || "$FORCE_REDEPLOY" == "1" ]]; then
  log "run redeploy from github/main"
  bash "$REPO_ROOT/datalens/scripts/ydl-os/redeploy-from-github-main.sh" | tee -a "$REPORT_FILE"
else
  log "redeploy skipped (no upstream lag and FORCE_REDEPLOY=0)"
fi

if [[ "$SECURITY_GATE" == "1" ]]; then
  log "run vulnerability scan with regression gate"
  if FAIL_ON_REGRESSION=1 ENFORCE_CRITICAL=0 bash "$REPO_ROOT/datalens/scripts/ydl-os/security-image-scan.sh" | tee -a "$REPORT_FILE"; then
    log "security gate passed"
  else
    log "security gate failed"
    exit 2
  fi
else
  log "security gate skipped (SECURITY_GATE=0)"
fi

FINAL_DIV="$(git rev-list --left-right --count upstream/main...github/main)"
log "final divergence upstream/main...github/main: $FINAL_DIV"
log "autopilot done"
