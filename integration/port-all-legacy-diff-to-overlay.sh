#!/usr/bin/env bash
# Port every legacy bulk diff file (not yet in overlay) → overlay/patches/datalens-ui/legacy-bulk/src/
# Goal: 0 paths from bulk-migration left outside overlay/patches.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

LEGACY_ROOT="${LEGACY_ROOT:-$HOME/ydl-os-future/overlay/components/datalens-ui/src}"
DEST_ROOT="${DEST_ROOT:-${OVERLAY_ROOT}/patches/datalens-ui/legacy-bulk/src}"
TAXONOMY_CSV="${TAXONOMY_CSV:-$(dirname "$0")/reports/bulk-overlay-taxonomy.csv}"
UI_VER="$(jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json")"
UPSTREAM_DIR="${UPSTREAM_DIR:-${YDL_UI_WORKDIR:-${YDL_REPO_ROOT}/.cache/datalens-ui}/v${UI_VER}}"
UPSTREAM_TAG="v${UI_VER}"
CORP_PATCH="${OVERLAY_ROOT}/patches/datalens-ui"
MANIFEST_APPEND="${MANIFEST_APPEND:-${YDL_REPO_ROOT}/integration/lib/legacy-bulk-manifest.txt}"

log() { echo "[port-all-legacy] $*"; }

in_corp_overlay() {
  local rel="$1"
  for m in "${CORP_PATCH}"/*/src; do
    [[ -e "${m}/${rel}" ]] && return 0
  done
  return 1
}

resolve_dest_module() {
  local cls="$1" mod="$2"
  case "$mod" in
    ydl-only|client-branding|client-features|client-date-controls|client-viz-settings|charts-engine-run|charts-params|ydl-config|ydl-routes|us-corporate|layout-branding|ydl-types)
      echo "$mod"
      ;;
    *)
      echo "legacy-bulk"
      ;;
  esac
}

mkdir -p "$DEST_ROOT"
: >"${MANIFEST_APPEND}.tmp"

ported=0
skipped_ported=0
missing=0

if [[ -f "$TAXONOMY_CSV" ]]; then
  log "from taxonomy $(basename "$TAXONOMY_CSV")"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" == path,* ]] && continue
    [[ -z "$line" ]] && continue
    rel="$(echo "$line" | sed 's/^"//;s/".*//' )"
    cls="$(echo "$line" | cut -d, -f2)"
    mod="$(echo "$line" | cut -d, -f4)"
    [[ "$cls" == "PORTED" ]] && { skipped_ported=$((skipped_ported + 1)); continue; }
    src="${LEGACY_ROOT}/${rel}"
    if [[ ! -e "$src" ]]; then
      missing=$((missing + 1))
      continue
    fi
    bucket="$(resolve_dest_module "$cls" "$mod")"
    if [[ "$bucket" != "legacy-bulk" ]] && in_corp_overlay "$rel"; then
      skipped_ported=$((skipped_ported + 1))
      continue
    fi
    dst="${CORP_PATCH}/${bucket}/src/${rel}"
    mkdir -p "$(dirname "$dst")"
    if [[ -d "$src" ]]; then
      rsync -a "${src}/" "${dst}/"
    else
      cp -a "$src" "$dst"
    fi
    if [[ "$bucket" == "legacy-bulk" ]]; then
      echo "legacy-bulk:${rel}" >>"${MANIFEST_APPEND}.tmp"
    fi
    ported=$((ported + 1))
  done <"$TAXONOMY_CSV"
else
  log "taxonomy missing — scan legacy vs upstream"
  while IFS= read -r f; do
    rel="${f#"${LEGACY_ROOT}/"}"
    upstream_rel="src/${rel}"
    if git -C "$UPSTREAM_DIR" cat-file -e "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null; then
      git -C "$UPSTREAM_DIR" show "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null | cmp -s - "$f" && continue
    fi
    in_corp_overlay "$rel" && { skipped_ported=$((skipped_ported + 1)); continue; }
    dst="${DEST_ROOT}/${rel}"
    mkdir -p "$(dirname "$dst")"
    cp -a "$f" "$dst"
    echo "legacy-bulk:${rel}" >>"${MANIFEST_APPEND}.tmp"
    ported=$((ported + 1))
  done < <(find "$LEGACY_ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.scss' \) ! -path '*/node_modules/*')
fi

# Also ensure every legacy≠upstream file exists somewhere in overlay
left=0
while IFS= read -r f; do
  rel="${f#"${LEGACY_ROOT}/"}"
  upstream_rel="src/${rel}"
  if git -C "$UPSTREAM_DIR" cat-file -e "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null; then
    git -C "$UPSTREAM_DIR" show "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null | cmp -s - "$f" && continue
  fi
  if in_corp_overlay "$rel" || [[ -e "${DEST_ROOT}/${rel}" ]]; then
    continue
  fi
  dst="${DEST_ROOT}/${rel}"
  mkdir -p "$(dirname "$dst")"
  cp -a "$f" "$dst"
  echo "legacy-bulk:${rel}" >>"${MANIFEST_APPEND}.tmp"
  ported=$((ported + 1))
  left=$((left + 1))
done < <(find "$LEGACY_ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.scss' \) ! -path '*/node_modules/*')

sort -u "${MANIFEST_APPEND}.tmp" -o "${MANIFEST_APPEND}.tmp"
mv "${MANIFEST_APPEND}.tmp" "$MANIFEST_APPEND"

log "ported=${ported} already_in_corp=${skipped_ported} missing_src=${missing} gap_fill=${left}"
log "manifest lines: $(wc -l <"$MANIFEST_APPEND") → ${MANIFEST_APPEND}"

# Verify 0 outside overlay
remaining="${YDL_REPO_ROOT}/integration/reports/legacy-not-in-overlay.txt"
: >"$remaining"
while IFS= read -r f; do
  rel="${f#"${LEGACY_ROOT}/"}"
  upstream_rel="src/${rel}"
  if git -C "$UPSTREAM_DIR" cat-file -e "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null; then
    git -C "$UPSTREAM_DIR" show "${UPSTREAM_TAG}:${upstream_rel}" 2>/dev/null | cmp -s - "$f" && continue
  fi
  in_corp_overlay "$rel" && continue
  [[ -e "${DEST_ROOT}/${rel}" ]] && continue
  echo "$rel" >>"$remaining"
done < <(find "$LEGACY_ROOT" -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.scss' \) ! -path '*/node_modules/*')

rem_count="$(wc -l <"$remaining" | tr -d ' ')"
if [[ "$rem_count" == "0" ]]; then
  log "OK: 0 legacy diff files left outside overlay"
else
  log "WARN: ${rem_count} still outside overlay → ${remaining}"
  exit 1
fi
