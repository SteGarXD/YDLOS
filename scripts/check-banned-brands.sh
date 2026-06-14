#!/usr/bin/env bash
# No IDE/AI assistant brand names in YDLOS-owned docs and platform config (not upstream UI vendored code).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
hits=0

scan() {
  local label="$1" pattern="$2"
  while IFS= read -r f; do
    if grep -qiE "$pattern" "$f" 2>/dev/null; then
      echo "BANNED ($label): $f"
      grep -niE "$pattern" "$f" | head -2
      hits=$((hits + 1))
    fi
  done < <(
    find "$ROOT/docs" "$ROOT/overlay/platform/docs" "$ROOT/overlay/platform/compose" \
      "$ROOT/integration" "$ROOT/scripts" \
      -maxdepth 3 -type f \( -name '*.md' -o -name '*.sh' -o -name '*.yaml' -o -name 'README.md' \) 2>/dev/null \
      | grep -Ev 'NAMING_POLICY|check-banned-brands|rebuild-history-by-topic' || true
    [[ -f "$ROOT/README.md" ]] && echo "$ROOT/README.md"
  )
}

scan 'cursor-ide' '(^|[^a-z-])cursor([^a-z-]|$)|\bCursor IDE\b|\bCursor\b'
scan 'ide-agent' '\bagents?\b.*\b(IDE|assistant|copilot)\b|\b(Cursor|Copilot)\b.*\bagent'

if [[ "$hits" -gt 0 ]]; then
  echo "check-banned-brands: $hits issue(s) in YDLOS-owned docs/config"
  exit 1
fi
echo "check-banned-brands: OK"
