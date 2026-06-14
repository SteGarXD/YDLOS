#!/usr/bin/env bash
# Scaffold design-note for next chart type (official workflow, no PR).
set -euo pipefail

ID="${1:?usage: chart-type-next.sh <chart-id> e.g. funnel}"
source "$(dirname "$0")/lib/env.sh"

NOTE="${OVERLAY_PLATFORM}/design-notes/chart-${ID}.md"
TEMPLATE="${OVERLAY_PLATFORM}/design-notes/_TEMPLATE.md"
QUEUE="${YDL_REPO_ROOT}/overlay/packages/datalens-extensions/charts/CHART_UPSTREAM_QUEUE.md"

[[ -f "$TEMPLATE" ]] || { echo "missing $TEMPLATE"; exit 1; }
if [[ -f "$NOTE" ]]; then
  echo "exists: $NOTE"
else
  sed "s/<feature>/chart-${ID}/" "$TEMPLATE" >"$NOTE"
  echo "created: $NOTE"
fi

if ! grep -q "### \[ \] ${ID}" "$QUEUE" 2>/dev/null; then
  cat >>"$QUEUE" <<EOF

### [ ] ${ID} — (title)

- Staging: [ ] create [ ] preview [ ] export
- Design note: overlay/platform/design-notes/chart-${ID}.md
- PR: (after full batch verified)
EOF
  echo "appended queue entry in CHART_UPSTREAM_QUEUE.md"
fi

echo "Next: implement like vendor preparer, build, publish, staging checklist — see docs/dev/workflow-dobavlenie-tipa-vizualizacii.md"
