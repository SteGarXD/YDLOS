#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

echo "=== overlay unit tests ==="
python3 -m unittest discover -s "${OVERLAY_PLATFORM}/tests" -p 'test_*.py' -v

echo "=== version alignment ==="
bash "$(dirname "$0")/check-version-alignment.sh"

echo "=== profile engine validate ==="
if [[ -d "$OVERLAY_PLATFORM/profiles/extracted" ]]; then
  python3 "$YDL_SCRIPTS/dashboard-profile-engine.py" validate \
    --profiles-dir "$OVERLAY_PLATFORM/profiles/extracted"
else
  echo "SKIP profile validate (profiles/extracted not in tree — public export)"
fi

echo "=== tests OK ==="
