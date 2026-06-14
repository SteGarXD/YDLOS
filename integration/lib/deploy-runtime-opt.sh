#!/usr/bin/env bash
# Sync only production runtime files to COMPOSE_DIR (no docs/backups/terraform in /opt).
set -euo pipefail

deploy_runtime_to_compose_dir() {
  local src_platform="$1"
  local compose_dir="$2"
  local vendor_datalens="$3"

  mkdir -p "$compose_dir/nginx" "$compose_dir/assets" "$compose_dir/compose"

  # Runtime base = official vendor compose (read-only submodule).
  install -m 0644 "$vendor_datalens/docker-compose.yaml" "$compose_dir/docker-compose.yaml"
  install -m 0644 "$vendor_datalens/docker-compose.yaml" "$compose_dir/docker-compose.vendor.yaml"
  install -m 0644 "$vendor_datalens/versions-config.json" "$compose_dir/versions-config.upstream.json"
  install -m 0644 "$src_platform/nginx/nginx-edge-proxy.conf" "$compose_dir/nginx/nginx-edge-proxy.conf"

  if [[ -d "$src_platform/compose" ]]; then
    rsync -a --delete "$src_platform/compose/" "$compose_dir/compose/"
  fi
  if [[ -d "$src_platform/assets" ]]; then
    rsync -a "$src_platform/assets/" "$compose_dir/assets/"
  fi
  if [[ -f "$src_platform/init.sh" ]]; then
    install -m 0755 "$src_platform/init.sh" "$compose_dir/init.sh"
  fi
  install -m 0644 "$vendor_datalens/versions-config.json" "$compose_dir/versions-config.json"
}
