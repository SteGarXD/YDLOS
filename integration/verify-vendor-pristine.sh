#!/usr/bin/env bash
# Fail if vendor/datalens has local modifications (must match upstream exactly).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

if [[ ! -e "${VENDOR_DATALENS}/.git" ]]; then
  echo "ERROR: vendor submodule missing. Run: git submodule update --init --recursive"
  exit 2
fi

cd "${VENDOR_DATALENS}"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: vendor/datalens is NOT pristine (local changes detected):"
  git status --short
  exit 3
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ "${REMOTE_URL}" != *"datalens-tech/datalens"* ]]; then
  echo "ERROR: vendor remote must be datalens-tech/datalens, got: ${REMOTE_URL}"
  exit 4
fi

echo "OK: vendor/datalens is pristine (${REMOTE_URL}) @ $(git rev-parse --short HEAD)"
