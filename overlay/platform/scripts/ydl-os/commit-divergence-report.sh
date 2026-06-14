#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/home/g.stepanov/datalens}"
cd "$REPO_ROOT"

git fetch upstream --prune >/dev/null 2>&1 || true
git fetch github --prune >/dev/null 2>&1 || true
git fetch origin --prune >/dev/null 2>&1 || true

echo "=== Commit Divergence Report ==="
echo "repo: $REPO_ROOT"
echo "generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo

echo "refs:"
echo "  upstream/main    $(git rev-parse --short upstream/main 2>/dev/null || echo N/A)"
echo "  github/main      $(git rev-parse --short github/main 2>/dev/null || echo N/A)"
echo "  origin/development $(git rev-parse --short origin/development 2>/dev/null || echo N/A)"
echo

if git rev-parse upstream/main >/dev/null 2>&1 && git rev-parse github/main >/dev/null 2>&1; then
  echo "upstream/main ... github/main:"
  git rev-list --left-right --count upstream/main...github/main
  echo "  format: <behind_upstream> <ahead_of_upstream>"
  echo
fi

if git merge-base upstream/main origin/development >/dev/null 2>&1; then
  echo "upstream/main ... origin/development:"
  git rev-list --left-right --count upstream/main...origin/development
  echo
else
  echo "upstream/main ... origin/development:"
  echo "  no merge-base (different history graph)"
  echo
fi

if git merge-base github/main origin/development >/dev/null 2>&1; then
  echo "github/main ... origin/development:"
  git rev-list --left-right --count github/main...origin/development
  echo
else
  echo "github/main ... origin/development:"
  echo "  no merge-base (different history graph)"
  echo
fi

echo "tip commits:"
git show -s --format='  upstream: %h %ci %s' upstream/main 2>/dev/null || true
git show -s --format='  github  : %h %ci %s' github/main 2>/dev/null || true
git show -s --format='  origin dev: %h %ci %s' origin/development 2>/dev/null || true
