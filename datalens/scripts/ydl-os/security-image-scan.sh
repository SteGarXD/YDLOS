#!/usr/bin/env bash
set -euo pipefail
export PATH="/home/g.stepanov/.local/bin:$PATH"

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/security}"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/trivy-images-${TS}.txt"

mkdir -p "$REPORT_DIR"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$REPORT_FILE"
}

if ! command -v trivy >/dev/null 2>&1; then
  log "SKIP: trivy not installed"
  exit 0
fi

mapfile -t IMAGES < <(docker ps --format '{{.Image}}' | sort -u)
if [[ "${#IMAGES[@]}" -eq 0 ]]; then
  log "SKIP: no running images found"
  exit 0
fi

log "start scan for ${#IMAGES[@]} images"
for image in "${IMAGES[@]}"; do
  log "scan image: $image"
  trivy image --quiet --severity HIGH,CRITICAL --format table "$image" >> "$REPORT_FILE" || true
done

log "scan finished -> $REPORT_FILE"
