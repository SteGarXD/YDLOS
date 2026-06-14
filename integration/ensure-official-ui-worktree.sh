#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/env.sh"
source "$(dirname "$0")/lib/ui-worktree.sh"
DIR="$(ensure_official_ui_worktree "${1:-}")"
apply_ui_patches "$DIR"
echo "$DIR"
