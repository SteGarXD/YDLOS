#!/usr/bin/env bash
# Canonical YDL OS docker compose file list (vendor base + overlay only).
set -euo pipefail

ydl_compose_files() {
  local repo_root="${1:?repo root}"
  local vendor="${repo_root}/vendor/datalens"
  local platform="${repo_root}/overlay/platform"
  local compose_dir="${2:-}"

  local base_platform="${compose_dir:-$platform}"
  local base_vendor="${vendor}/docker-compose.yaml"
  if [[ -n "${compose_dir}" && -f "${compose_dir}/docker-compose.yaml" ]]; then
    base_vendor="${compose_dir}/docker-compose.yaml"
  fi

  local files=(
    -f "${base_vendor}"
    -f "${base_platform}/compose/docker-compose.ydl-platform.yaml"
    -f "${base_platform}/compose/docker-compose.edge-production.yaml"
    -f "${base_platform}/compose/docker-compose.official-images.yaml"
  )

  if [[ "${YDL_LEGACY_AUTH:-0}" == "1" ]]; then
    files+=(-f "${base_platform}/compose/deprecated/docker-compose.ydl-legacy-auth.yaml")
  else
    files+=(-f "${base_platform}/compose/docker-compose.ydl-official-auth.yaml")
  fi

  # Always merge built-image overrides when compose file exists; .env must define YDL_UI_IMAGE.
  if [[ -f "${base_platform}/compose/docker-compose.ydl-built-images.yaml" ]]; then
    files+=(-f "${base_platform}/compose/docker-compose.ydl-built-images.yaml")
  fi
  if [[ -f "${base_platform}/compose/docker-compose.security-hardening.yaml" ]]; then
    files+=(-f "${base_platform}/compose/docker-compose.security-hardening.yaml")
  fi
  if [[ "${YDL_BI_FULL:-1}" == "1" ]]; then
    files+=(-f "${base_platform}/compose/docker-compose.ydl-bi-full.yaml")
    files+=(-f "${base_platform}/compose/docker-compose.ydl-oidc-multi.yaml")
  fi
  if [[ "${YDL_METRICS:-1}" == "1" ]]; then
    files+=(-f "${base_platform}/compose/docker-compose.ydl-metrics.yaml")
  fi
  # Deprecated alias: USE_OFFICIAL_AUTH_STAGING=1 → same as default official auth
  if [[ "${USE_OFFICIAL_AUTH_STAGING:-0}" == "1" && "${YDL_LEGACY_AUTH:-0}" == "1" ]]; then
    files+=(-f "${base_platform}/compose/docker-compose.ydl-official-auth.yaml")
  fi
  if [[ -n "${YDL_COMPOSE_EXTRA:-}" ]]; then
    read -r -a _extra <<< "${YDL_COMPOSE_EXTRA}"
    for f in "${_extra[@]}"; do
      files+=(-f "${f}")
    done
  fi

  printf '%s\n' "${files[@]}"
}
