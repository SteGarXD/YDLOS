#!/usr/bin/env bash
# HC=0 policy smoke: env + catalog list (full E2E per chart type = staging manual / playwright).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

echo "=== smoke chart types @ HC=${HC:-0} ==="
[[ "${HC:-0}" == "0" ]] || echo "WARN: HC!=0 — Highcharts path may hide D3/gravity variants"

bash "$(dirname "$0")/list-official-chart-types.sh"

echo ""
echo "=== platform smoke ==="
bash "$(dirname "$0")/smoke-official-stack.sh"

echo "=== chart smoke OK (catalog listed; per-type UI E2E on staging) ==="
