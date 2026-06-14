#!/usr/bin/env bash
# US rebase: overlay 0.413 -> vendor usVersion (1.39.0). Requires pnpm + official auth migration.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

TARGET="${1:-$(jq -r .usVersion "${VENDOR_DATALENS}/versions-config.json")}"
WORKDIR="${US_REBASE_WORKDIR:-/tmp/ydl-us-rebase}"
OVERLAY_US="${OVERLAY_COMPONENTS}/datalens-us"
LEGACY="${OVERLAY_COMPONENTS}/datalens-us-0.413-legacy"
UPSTREAM="${WORKDIR}/datalens-us-upstream"

echo "=== US rebase (conscious) ==="
echo "overlay US now:  $(jq -r .version "${OVERLAY_US}/package.json" 2>/dev/null || echo missing)"
echo "vendor target:   ${TARGET} (datalens-tech/datalens-us)"
echo "vendor release:  $(jq -r .releaseVersion "${VENDOR_DATALENS}/versions-config.json")"
echo ""

if [[ "${2:-}" != "--execute" ]]; then
  cat <<EOF
This is a MAJOR migration (not git pull vendor alone):

  1. Auth: us-auth + NODE_RPC_URL -> ghcr datalens-auth:${TARGET%.*}.* (see versions-config authVersion)
  2. US:   npm/0.413 tree -> pnpm/1.39 tree; ~80 src deltas vs 0.413 to triage
  3. DB:   backup pg-us-db + pg-auth-db; run US migrations on STAGING first

Commands:
  bash integration/migrate-to-official-stack.sh report
  bash integration/migrate-to-official-stack.sh backup
  bash integration/migrate-to-official-stack.sh legacy-snapshot
  bash $(basename "$0") ${TARGET} --execute   # copies v${TARGET} base into overlay (new branch!)

After --execute:
  - Review overlay/components/datalens-us vs ${LEGACY}
  - Port only required files (entries/*, profiles) — drop zitadel-in-US if using official auth
  - Install: cd overlay/components/datalens-us && pnpm install && pnpm run build
  - Test: USE_OFFICIAL_AUTH_STAGING=1 on staging host
  - Doc: overlay/platform/docs/MIGRATION_US_AUTH_1.39.md

EOF
  exit 0
fi

mkdir -p "$WORKDIR"
if [[ ! -d "${UPSTREAM}/.git" ]]; then
  git clone --depth 1 --branch "v${TARGET}" https://github.com/datalens-tech/datalens-us.git "$UPSTREAM"
else
  git -C "$UPSTREAM" fetch --depth 1 origin "v${TARGET}"
  git -C "$UPSTREAM" checkout -f "v${TARGET}"
fi

if [[ ! -d "$LEGACY" ]]; then
  echo "Saving legacy tree -> ${LEGACY}"
  cp -a "$OVERLAY_US" "$LEGACY"
fi

TS="$(date -u +%Y%m%d-%H%M%SZ)"
echo "Replacing ${OVERLAY_US} with upstream v${TARGET} (node_modules/dist excluded)"
rm -rf "${OVERLAY_US:?}"/*
rsync -a --exclude node_modules --exclude dist --exclude .git \
  "${UPSTREAM}/" "${OVERLAY_US}/"

# Manifest of files only in legacy (manual port list)
comm -23 \
  <(cd "${LEGACY}/src" && find . -name '*.ts' | sort) \
  <(cd "${OVERLAY_US}/src" && find . -name '*.ts' | sort) \
  >"${OVERLAY_PLATFORM}/reports/us-rebase-only-in-legacy-${TS:-$(date -u +%Y%m%d-%H%M%SZ)}.txt" 2>/dev/null || true

echo ""
echo "=== Base replaced. Next (manual) ==="
echo "1. Port files listed in overlay/platform/reports/us-rebase-only-in-legacy-*.txt"
echo "2. pnpm install && pnpm run build in ${OVERLAY_US}"
echo "3. bash integration/migrate-to-official-stack.sh compose-staging"
echo "4. Do NOT deploy to prod until staging smoke passes"
