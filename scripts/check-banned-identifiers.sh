#!/usr/bin/env bash
# Fail if legacy fork identifiers appear in overlay source / integration.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PATTERN='\bakrasnov(87)?\b'
EXCLUDE='(reports/|backups/|\.git/|node_modules/|dist/|legacy-akrasnov|akrasnov87-images|datalens-us-0\.413-legacy|akrasnov-rpc/handlers\.ts|register-akrasnov-routes|controllers/akrasnov-rpc|AKRASNOV87_|sync-akrasnov)'

hits=0
while IFS= read -r -d '' f; do
  if grep -qiE "$PATTERN" "$f" 2>/dev/null; then
    echo "BANNED: $f"
    grep -niE "$PATTERN" "$f" | head -3
    hits=$((hits + 1))
  fi
done < <(
  find "$ROOT/overlay" "$ROOT/integration" "$ROOT/scripts" "$ROOT/docs" \
    -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.sh' -o -name '*.yaml' -o -name '*.md' \) \
    ! -path '*/node_modules/*' ! -path '*/dist/*' 2>/dev/null \
    | grep -Ev "$EXCLUDE" || true | tr '\n' '\0'
)

if [[ "$hits" -gt 0 ]]; then
  echo "check-banned-identifiers: $hits file(s) — rename per NAMING_POLICY.md"
  exit 1
fi
echo "check-banned-identifiers: OK"
