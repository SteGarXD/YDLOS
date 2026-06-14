#!/usr/bin/env bash
# Official datalens-ui tag + modular YDL overlay (no bulk trees, no duplicate apply).
set -euo pipefail

ui_worktree_dir() {
  local ver="${1:-$(jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json")}"
  echo "${YDL_UI_WORKDIR:-${YDL_REPO_ROOT}/.cache/datalens-ui}/v${ver}"
}

ui_official_tag() {
  jq -r .uiVersion "${VENDOR_DATALENS}/versions-config.json"
}

ensure_official_ui_worktree() {
  local tag="${1:-$(ui_official_tag)}"
  local dir
  dir="$(ui_worktree_dir "$tag")"
  if [[ -d "${dir}/.git" ]]; then
    git -C "$dir" fetch --depth 1 origin "refs/tags/v${tag}:refs/tags/v${tag}" 2>/dev/null || true
    git -C "$dir" checkout -f "v${tag}" 2>/dev/null || git -C "$dir" checkout -f "tags/v${tag}"
    git -C "$dir" clean -fdxq 2>/dev/null || true
    rm -rf "${dir}/node_modules" "${dir}/dist" "${dir}/.cache" "${dir}/node_modules/.cache"
  else
    mkdir -p "$(dirname "$dir")"
    git clone --depth 1 --branch "v${tag}" https://github.com/datalens-tech/datalens-ui.git "$dir"
  fi
  echo "$dir"
}

_apply_manifest_file() {
  local root="$1"
  local manifest="$2"
  local patches="${OVERLAY_ROOT}/patches/datalens-ui"
  [[ -f "$manifest" ]] || return 0

  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | xargs)"
    [[ -z "$line" ]] || [[ "$line" != *:* ]] && continue
    local src_key="${line%%:*}"
    local rel="${line#*:}"
    local src="${patches}/${src_key}/src/${rel}"
    local dst="${root}/src/${rel}"
    if [[ ! -e "$src" ]]; then
      echo "[apply-ui-patches] WARN missing ${src_key}:${rel}" >&2
      continue
    fi
    echo "[apply-ui-patches] ${src_key}:${rel}"
    mkdir -p "$(dirname "$dst")"
    if [[ -d "$src" ]]; then
      rsync -a "${src}/" "${dst}/"
    else
      cp -a "$src" "$dst"
    fi
  done < "$manifest"
}

copy_corporate_branding_assets() {
  local root="$1"
  local assets="${OVERLAY_PLATFORM}/assets"
  local logo_dst="${root}/src/ui/assets/icons/os-logo.svg"
  local public_dst="${root}/public"
  if [[ -f "${assets}/favicorn.64x64.svg" ]]; then
    echo "[apply-ui-patches] corporate favicon → os-logo.svg + public/favicorn.64x64.svg"
    mkdir -p "$(dirname "$logo_dst")" "$public_dst"
    cp -a "${assets}/favicorn.64x64.svg" "$logo_dst"
    cp -a "${assets}/favicorn.64x64.svg" "${public_dst}/favicorn.64x64.svg"
    [[ -f "${assets}/favicorn.48x48.svg" ]] && cp -a "${assets}/favicorn.48x48.svg" "${public_dst}/favicorn.48x48.svg"
  fi
  if [[ -f "${assets}/ydl-early-guards.js" ]]; then
    echo "[apply-ui-patches] ydl-early-guards.js → public/"
    mkdir -p "$public_dst"
    cp -a "${assets}/ydl-early-guards.js" "${public_dst}/ydl-early-guards.js"
  fi
}

_apply_client_tier() {
  local root="$1"
  local tier="${YDL_UI_CLIENT_TIER:-corp}"
  local lib_dir
  lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

  case "$tier" in
    none|0|server)
      return 0
      ;;
    branding)
      _apply_manifest_file "$root" "${lib_dir}/corporate-client-branding-manifest.txt"
      copy_corporate_branding_assets "$root"
      ;;
    corp|features|all|full)
      _apply_manifest_file "$root" "${lib_dir}/corporate-client-corp-manifest.txt"
      copy_corporate_branding_assets "$root"
      ;;
    *)
      echo "[apply-ui-patches] unknown YDL_UI_CLIENT_TIER=${tier}" >&2
      return 1
      ;;
  esac
}

_apply_legacy_bulk_overlay() {
  local _root="$1"
  # legacy-bulk/src was split into module-local legacy-candidates/ directories.
  # Full legacy rsync is intentionally disabled: each candidate must move into
  # its module src/ only after compatibility work and a green build.
  if [[ "${YDL_APPLY_LEGACY_BULK:-0}" == "1" ]]; then
    echo "[apply-ui-patches] ERROR: YDL_APPLY_LEGACY_BULK was retired; port module legacy-candidates into src/ explicitly" >&2
    return 1
  fi
}

apply_ui_patches() {
  local root="$1"
  local patches="${OVERLAY_ROOT}/patches/datalens-ui"

  _apply_legacy_bulk_overlay "$root"

  # Module src/ rsync (order = MODULE_APPLY_ORDER.txt; later module wins on path clash).
  for sub in \
    ydl-config layout-branding charts-engine-run charts-params corp-chart-profiles corp-dash-profile \
    client-viz-corp client-branding client-features client-date-controls \
    client-viz-settings ydl-only ydl-routes us-corporate; do
    # corp-chart-profiles: compiled into dist by apply_ui_patches before app-builder; publish copies preparers + wizard into image
    [[ -d "${patches}/${sub}/src" ]] || continue
    echo "[apply-ui-patches] ${sub} (override)"
    rsync -a "${patches}/${sub}/src/" "${root}/src/"
    if [[ -d "${patches}/${sub}/i18n-keysets" ]]; then
      echo "[apply-ui-patches] ${sub} (i18n-keysets merge)"
      while IFS= read -r -d '' patch_file; do
        rel="${patch_file#${patches}/${sub}/i18n-keysets/}"
        target="${root}/src/i18n-keysets/${rel}"
        [[ -f "$target" ]] || continue
        jq -s '.[0] * .[1]' "$target" "$patch_file" > "${target}.ydl-merge.tmp" \
          && mv "${target}.ydl-merge.tmp" "$target"
      done < <(find "${patches}/${sub}/i18n-keysets" -name '*.json' -print0)
    fi
  done

  if [[ -d "${patches}/ydl-types/src" ]]; then
    echo "[apply-ui-patches] ydl-types"
    rsync -a "${patches}/ydl-types/src/" "${root}/src/"
  fi

  _apply_ydl_git_patches "$root"
  _apply_client_tier "$root"
  bash "$(dirname "${BASH_SOURCE[0]}")/patch-repka-dialog-parameter.sh" "$root"
}

_apply_ydl_git_patches() {
  local root="$1"
  local patch_dir
  patch_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/patches/datalens-ui"
  [[ -d "$patch_dir" ]] || return 0
  for p in "${patch_dir}"/*.patch; do
    [[ -f "$p" ]] || continue
    if [[ "$(basename "$p")" == "ydl-private-flight-groups-and-selectors.patch" ]]; then
      echo "[apply-ui-patches] skip $(basename "$p") (selector cascade removed from overlay)"
      continue
    fi
    echo "[apply-ui-patches] git apply $(basename "$p")"
    git -C "$root" apply --whitespace=nowarn "$p"
  done
}
