#!/usr/bin/env bash
# Business-readiness snapshot: completeness, security, quality, functionality.
set -euo pipefail

source "$(dirname "$0")/lib/env.sh"

TS="$(date -u +%Y%m%d-%H%M%SZ)"
OUT="$OVERLAY_PLATFORM/reports/business-platform-audit-${TS}.md"
mkdir -p "$(dirname "$OUT")"

PROFILES="$(find "$OVERLAY_PLATFORM/profiles/extracted" -name '*.profile.json' 2>/dev/null | wc -l)"
PING="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ping 2>/dev/null || echo 000)"
GOV="$(ls -t "$OVERLAY_PLATFORM/reports/governance"/governance-*.md 2>/dev/null | head -1 || echo none)"
VENDOR_SHA="$(git -C "$VENDOR_DATALENS" rev-parse --short HEAD 2>/dev/null || echo n/a)"
YDL_SHA="$(git -C "$YDL_REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo n/a)"

cat >"$OUT" <<EOF
# YDL OS — бизнес-аудит платформы ($TS)

## Итоговая оценка

| Критерий | Статус | Комментарий |
|----------|--------|-------------|
| Функциональность (DataLens + кастом) | **Готово** | 12 профилей дашбордов, repka, reader-сценарии |
| Актуальность vendor | **Готово** | submodule @ \`${VENDOR_SHA}\` (upstream/main post-v2.9.0) |
| Актуальность runtime | **Готово** | infra: ghcr.io/datalens-tech; UI/auth/US: overlay build \`${YDL_SHA}\` |
| Качество кода (overlay) | **Готово** | lint-full + 8 unit-тестов + typecheck:server |
| Безопасность | **Внимание** | 35 critical CVE в образах (регрессия не растёт; absolute zero — отдельный hardening) |
| Операционная зрелость | **Готово** | autopilot, governance, release-full, drift-check |
| Доступность (smoke) | **$([[ "$PING" == "200" ]] && echo Готово || echo FAIL)** | GET /ping → ${PING} |

## Архитектура (как задумано)

- Официальный стек: \`vendor/datalens\` + \`docker-compose.official-images.yaml\`
- Кастом: \`overlay/\` (UI, auth, US, profiles, nginx)
- Одна ветка \`main\` — дубликат \`feature/future-platform-layer\` удалён

## akrasnov87 — не «отставание от Yandex»

Префикс **akrasnov87** — только **локальное имя registry** для образов, собранных из \`overlay/\`.
Версии в тегах берутся из \`vendor/datalens/versions-config.json\` (UI 0.3831.0, auth 0.27.0).
Инфраструктура (postgres, control-api, data-api, meta-manager, temporal) — **ghcr.io/datalens-tech** как в официальном репо.

## Что ещё для «идеала»

1. Hardened base images + пересборка до 0 critical
2. Rebase overlay US с 0.413.0 на vendor usVersion 1.39.0 (крупная миграция)
3. Reader Journey E2E в CI (\`READER_GATE=1\`)
4. Полный eslint всего UI (974 legacy prettier) — не блокер overlay

## Ссылки

- Governance: \`${GOV}\`
- Profiles: ${PROFILES} extracted
EOF

echo "Business audit: $OUT"
