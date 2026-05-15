#!/usr/bin/env bash
set -euo pipefail

# Syncs official upstream into local development branch with guardrails.

echo "[1/6] Fetching upstream..."
git fetch upstream

echo "[2/6] Switching to main..."
git checkout main

echo "[3/6] Fast-forwarding main from upstream/main..."
git merge --ff-only upstream/main

echo "[4/6] Switching to development..."
git checkout development

echo "[5/6] Rebasing development on updated main..."
git rebase main

echo "[6/6] Done. Resolve conflicts (if any), run tests/smoke checks, then push."

