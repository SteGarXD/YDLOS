#!/usr/bin/env bash
# List wizard/QL visualization IDs and datalens preparer modules (official catalog @ overlay UI).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

VIS="${OVERLAY_COMPONENTS}/datalens-ui/src/shared/constants/visualization.ts"
PREP="${OVERLAY_COMPONENTS}/datalens-ui/src/server/modes/charts/plugins/datalens/preparers"

echo "=== WizardVisualizationId (enum) ==="
grep -E "^\s+\w+ = '" "$VIS" | sed "s/.*= '\([^']*\)'.*/\1/" | sort -u

echo ""
echo "=== QlVisualizationId ==="
sed -n '/export enum QlVisualizationId/,/^}/p' "$VIS" | grep -E "^\s+\w+ = '" | sed "s/.*= '\([^']*\)'.*/\1/" | sort -u

echo ""
echo "=== Preparer modules (datalens/preparers/*) ==="
find "$PREP" -mindepth 1 -maxdepth 1 -type d ! -name __tests__ | xargs -n1 basename | sort

echo ""
echo "Count wizard IDs: $(grep -E "^\s+\w+ = '" "$VIS" | wc -l)"
echo "HC=0: enable all *registered* types above — not unregistered chart libraries."
echo "New types: one upstream PR each — see overlay/packages/datalens-extensions/charts/CHART_UPSTREAM_QUEUE.md"
