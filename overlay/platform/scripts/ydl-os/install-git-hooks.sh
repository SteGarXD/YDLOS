#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
HOOK_SRC="$REPO_ROOT/overlay/platform/scripts/git-hooks/prepare-commit-msg"
# Worktrees use .git file → real git dir is under main repo (e.g. datalens/.git)
GIT_DIR="$(cd "$REPO_ROOT" && git rev-parse --git-dir)"
GIT_COMMON_DIR="$(cd "$REPO_ROOT" && git rev-parse --git-common-dir)"
HOOK_DST="${GIT_COMMON_DIR}/hooks/prepare-commit-msg"
install -m 0755 "$HOOK_SRC" "$HOOK_DST"
echo "Installed: $HOOK_DST (strips unwanted Co-authored-by trailers)"
