#!/usr/bin/env bash
set -euo pipefail
export PATH="/home/g.stepanov/.local/bin:$PATH"

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
REPORT_DIR="${REPORT_DIR:-$REPO_ROOT/datalens/reports/security}"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/trivy-images-${TS}.txt"
SUMMARY_FILE="$REPORT_DIR/trivy-images-${TS}-summary.txt"
BASELINE_FILE="${BASELINE_FILE:-$REPO_ROOT/datalens/security-baseline.json}"
FAIL_ON_REGRESSION="${FAIL_ON_REGRESSION:-0}"
ENFORCE_CRITICAL="${ENFORCE_CRITICAL:-0}"

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

TMP_JSON="$(mktemp)"
TMP_SUMMARY="$(mktemp)"
trap 'rm -f "$TMP_JSON" "$TMP_SUMMARY"' EXIT

if [[ -f "$BASELINE_FILE" ]]; then
  cp "$BASELINE_FILE" "$TMP_JSON"
else
  echo '{"images":{}}' > "$TMP_JSON"
fi

printf "image|high|critical|status\n" > "$SUMMARY_FILE"
printf "{}\n" > "$TMP_SUMMARY"

log "start scan for ${#IMAGES[@]} images"
for image in "${IMAGES[@]}"; do
  log "scan image: $image"
  IMAGE_JSON="$(mktemp)"
  trivy image --quiet --severity HIGH,CRITICAL --format json "$image" > "$IMAGE_JSON" || true

  read -r HIGH CRIT < <(python3 - <<'PY' "$IMAGE_JSON"
import json, sys
path=sys.argv[1]
high=0
crit=0
try:
    data=json.load(open(path))
except Exception:
    print("0 0")
    raise SystemExit(0)
for r in data.get("Results", []) or []:
    for v in (r.get("Vulnerabilities") or []):
        s=(v.get("Severity") or "").upper()
        if s=="HIGH":
            high += 1
        elif s=="CRITICAL":
            crit += 1
print(f"{high} {crit}")
PY
)

  read -r BASE_HIGH BASE_CRIT < <(python3 - <<'PY' "$TMP_JSON" "$image"
import json, sys
data=json.load(open(sys.argv[1]))
img=sys.argv[2]
v=(data.get("images", {}) or {}).get(img, {})
print(f"{int(v.get('high',0))} {int(v.get('critical',0))}")
PY
)

  STATUS="ok"
  if (( CRIT > BASE_CRIT || HIGH > BASE_HIGH )); then
    STATUS="regression"
  fi

  printf "%s|%s|%s|%s\n" "$image" "$HIGH" "$CRIT" "$STATUS" | tee -a "$SUMMARY_FILE" >> "$REPORT_FILE"

  python3 - <<'PY' "$TMP_SUMMARY" "$image" "$HIGH" "$CRIT"
import json, sys
path, img, high, crit = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
data={}
try:
    data=json.load(open(path))
except Exception:
    data={}
data[img]={"high":high,"critical":crit}
with open(path,"w") as f:
    json.dump(data,f,ensure_ascii=False)
PY

  trivy image --quiet --severity HIGH,CRITICAL --format table "$image" >> "$REPORT_FILE" || true
  rm -f "$IMAGE_JSON"
done

TOTAL_HIGH="$(python3 - <<'PY' "$TMP_SUMMARY"
import json, sys
data=json.load(open(sys.argv[1]))
print(sum(v.get("high",0) for v in data.values()))
PY
)"
TOTAL_CRIT="$(python3 - <<'PY' "$TMP_SUMMARY"
import json, sys
data=json.load(open(sys.argv[1]))
print(sum(v.get("critical",0) for v in data.values()))
PY
)"

REGRESSIONS="$(awk -F'|' 'NR>1 && $4=="regression" {print $1}' "$SUMMARY_FILE" | paste -sd ',' -)"
if [[ -z "${REGRESSIONS:-}" ]]; then
  REGRESSIONS="none"
fi

{
  echo
  echo "totals|high=${TOTAL_HIGH}|critical=${TOTAL_CRIT}|regressions=${REGRESSIONS}"
  echo "baseline_file=${BASELINE_FILE}"
} | tee -a "$SUMMARY_FILE" >> "$REPORT_FILE"

log "scan finished -> $REPORT_FILE"

if [[ "$FAIL_ON_REGRESSION" == "1" ]] && [[ "$REGRESSIONS" != "none" ]]; then
  log "ERROR: vulnerability regression detected"
  exit 2
fi

if [[ "$ENFORCE_CRITICAL" == "1" ]] && (( TOTAL_CRIT > 0 )); then
  log "ERROR: critical vulnerabilities found (critical=${TOTAL_CRIT})"
  exit 3
fi
