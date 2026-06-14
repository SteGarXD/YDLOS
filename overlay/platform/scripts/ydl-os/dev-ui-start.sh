#!/usr/bin/env bash
# Устаревшее имя: полная production-сборка. Для ежедневной работы используйте dev-start.sh (HMR).
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/dev-prod-start.sh" "$@"
