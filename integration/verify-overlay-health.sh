#!/usr/bin/env bash
# Pre/post bump: overlay modules, manifest paths, anti-patterns, optional UI build.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"
source "$(dirname "$0")/lib/ui-worktree.sh"

UI_VER="$(jq -r '.uiVersion' "${VENDOR_DATALENS}/versions-config.json")"
UI_DIR="$(ensure_official_ui_worktree "$UI_VER")"
FAIL=0

fail() {
  echo "FAIL $*" >&2
  FAIL=1
}

ok() {
  echo "OK  $*"
}

echo "=== verify-overlay-health (uiVersion=${UI_VER}) ==="

bash "$(dirname "$0")/verify-vendor-pristine.sh"

# Dead files that must not rsync (upstream identical or removed intentionally)
if [[ -f "${OVERLAY_ROOT}/patches/datalens-ui/charts-params/src/shared/modules/charts-shared.ts" ]]; then
  fail "charts-params/charts-shared.ts must not exist (use upstream only)"
else
  ok "charts-params has no dead charts-shared.ts"
fi

# Required active modules
for mod in corp-dash-profile corp-chart-profiles; do
  if [[ -d "${OVERLAY_ROOT}/patches/datalens-ui/${mod}/src" ]]; then
    ok "module ${mod}/src present"
  else
    fail "missing module ${mod}/src"
  fi
done

# No duplicate src paths across modules (later rsync wins — silent overwrite)
ORDER_FILE="${OVERLAY_ROOT}/patches/datalens-ui/MODULE_APPLY_ORDER.txt"
declare -A PATH_OWNER=()
while IFS= read -r mod; do
  [[ -z "$mod" || "$mod" =~ ^# ]] && continue
  mod_dir="${OVERLAY_ROOT}/patches/datalens-ui/${mod}/src"
  [[ -d "$mod_dir" ]] || continue
  while IFS= read -r -d '' f; do
    rel="${f#${mod_dir}/}"
    if [[ -n "${PATH_OWNER[$rel]:-}" && "${PATH_OWNER[$rel]}" != "$mod" ]]; then
      fail "path conflict ${rel}: ${PATH_OWNER[$rel]} vs ${mod} (see MODULE_APPLY_ORDER.txt)"
    else
      PATH_OWNER[$rel]="$mod"
    fi
  done < <(find "$mod_dir" -type f -print0)
done <"$ORDER_FILE"
if [[ "$FAIL" -eq 0 ]]; then
  ok "no cross-module src path conflicts"
fi

# Manifest paths must exist in overlay
MANIFEST="${YDL_REPO_ROOT}/integration/lib/corporate-client-corp-manifest.txt"
while IFS= read -r line; do
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  if [[ "$line" != *:* ]]; then
    continue
  fi
  mod="${line%%:*}"
  rel="${line#*:}"
  src="${OVERLAY_ROOT}/patches/datalens-ui/${mod}/src/${rel}"
  if [[ -e "$src" ]]; then
    ok "manifest ${mod}:${rel}"
  else
    fail "manifest missing overlay file ${mod}:${rel}"
  fi
done <"$MANIFEST"

# Apply patches — capture missing manifest tier warnings
PATCH_LOG="$(mktemp)"
apply_ui_patches "$UI_DIR" >"$PATCH_LOG" 2>&1 || fail "apply_ui_patches failed"
if rg -q "WARN missing" "$PATCH_LOG"; then
  rg "WARN missing" "$PATCH_LOG" >&2
  fail "manifest tier references missing files (fix corporate-client-corp-manifest.txt)"
else
  ok "apply_ui_patches without WARN missing"
fi

# Gate helpers present in worktree
for f in \
  "src/ui/units/dash/utils/corpRuntimeGate.ts" \
  "src/ui/units/dash/store/migrateCorpDashSettings.ts"; do
  if [[ -f "${UI_DIR}/${f}" ]]; then
    ok "worktree ${f}"
  else
    fail "worktree missing ${f}"
  fi
done

if rg -q "dependentSelectors: true" "${UI_DIR}/src/ui/units/dash/store/migrateCorpDashSettings.ts" \
  && rg -q "dashEntryUsesCorpSelectorRuntime" "${UI_DIR}/src/ui/units/dash/store/migrateCorpDashSettings.ts"; then
  ok "migrateCorpDashSettings is gated"
else
  fail "migrateCorpDashSettings missing corp gate"
fi

if [[ "${YDL_UI_CLIENT_BUILD:-0}" == "1" ]]; then
  echo "[verify-overlay-health] UI build..."
  if (cd "$UI_DIR" && npm run build); then
    ok "npm run build"
  else
    fail "npm run build"
  fi
fi

rm -f "$PATCH_LOG"

if [[ "$FAIL" -eq 0 ]]; then
  echo "=== verify-overlay-health OK ==="
else
  echo "=== verify-overlay-health FAILED ===" >&2
  exit 1
fi
