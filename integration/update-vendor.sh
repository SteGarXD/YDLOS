#!/usr/bin/env bash
# Update vendor/datalens submodule to official datalens-tech/datalens (read-only pin).
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

REF="${1:-main}"
echo "Updating vendor/datalens to origin/${REF}"

cd "${VENDOR_DATALENS}"
git fetch origin --tags --prune
if git show-ref --verify --quiet "refs/tags/${REF}"; then
  git checkout "${REF}"
elif git show-ref --verify --quiet "refs/remotes/origin/${REF}"; then
  git checkout "origin/${REF}" -B "vendor-track-${REF}"
else
  echo "ERROR: ref not found: ${REF}"
  exit 2
fi

cd "${YDL_REPO_ROOT}"
git add vendor/datalens
bash "$(dirname "$0")/verify-vendor-pristine.sh"
echo "Commit vendor bump: git commit -m \"chore(vendor): pin datalens-tech/datalens @ ${REF}\""
