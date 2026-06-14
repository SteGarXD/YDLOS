#!/usr/bin/env bash
# ============================================================
# YDL OS — цикл синхронизации с upstream (datalens-tech/datalens)
# ============================================================
# Не выполняет «магический merge» несовместимых деревьев: фиксирует факты,
# пишет отчёт, опционально собирает кастомные образы и смоук-тестирует стек.
#
# Запуск из любого cwd:
#   bash overlay/platform/scripts/ydl-os/sync-platform-upstream.sh
#
# Переменные окружения:
#   FETCH_ONLY=1       — только git fetch + отчёт (по умолчанию, если не задано иное)
#   BUILD_CUSTOM=1     — после отчёта: docker build UI + auth (см. пути ниже)
#   COMPOSE_DIR=${YDL_COMPOSE_DIR}  — если задан и SMOKE=1: curl /ping на localhost:80
#   SMOKE=1            — смоук (нужен COMPOSE_DIR или уже поднятый nginx на :80)
#   UPSTREAM_REF=upstream/main  — ветка/тег для сравнения
#   PROFILE_VALIDATE=1 — валидация dashboard profiles (по умолчанию 1)
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INNER_DATALENS="$(cd "$SCRIPT_DIR/../.." && pwd)"
YDL_REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
VENDOR_DATALENS="${YDL_REPO_ROOT}/vendor/datalens"
UPSTREAM_REF="${UPSTREAM_REF:-origin/main}"
REPORT_DIR="$INNER_DATALENS/reports"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/upstream-sync-${TS}.md"
PROFILE_VALIDATE="${PROFILE_VALIDATE:-1}"
PROFILES_DIR="${PROFILES_DIR:-$INNER_DATALENS/profiles/extracted}"

mkdir -p "$REPORT_DIR"
cd "$YDL_REPO_ROOT"

{
  echo "# Upstream sync report ($TS)"
  echo
  echo "- YDL repo root: \`$YDL_REPO_ROOT\`"
  echo "- Overlay platform: \`$INNER_DATALENS\`"
  echo "- Vendor submodule: \`$VENDOR_DATALENS\`"
  echo "- Upstream ref: \`$UPSTREAM_REF\` (datalens-tech/datalens)"
  echo
} >"$REPORT_FILE"

echo "=== YDL OS upstream sync ==="
echo "YDL_REPO_ROOT=$YDL_REPO_ROOT"
echo "VENDOR_DATALENS=$VENDOR_DATALENS"
echo "Report: $REPORT_FILE"
echo ""

if ! git -C "$VENDOR_DATALENS" rev-parse HEAD >/dev/null 2>&1; then
  echo "ERROR: vendor submodule missing at $VENDOR_DATALENS" | tee -a "$REPORT_FILE"
  exit 1
fi

bash "$YDL_REPO_ROOT/integration/verify-vendor-pristine.sh" | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

echo "## Vendor remotes (datalens-tech/datalens)" | tee -a "$REPORT_FILE"
git -C "$VENDOR_DATALENS" remote -v | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

echo "## git fetch vendor" | tee -a "$REPORT_FILE"
set +e
git -C "$VENDOR_DATALENS" fetch origin --tags --prune 2>&1 | tee -a "$REPORT_FILE"
FE_V=$?
set -e
if [[ "$FE_V" -ne 0 ]]; then
  echo "**WARN:** vendor fetch exited $FE_V" >>"$REPORT_FILE"
fi
echo "" >>"$REPORT_FILE"

echo "## Vendor pin vs upstream ref" | tee -a "$REPORT_FILE"
VENDOR_HEAD="$(git -C "$VENDOR_DATALENS" rev-parse HEAD)"
echo "- vendor HEAD: \`$VENDOR_HEAD\`" | tee -a "$REPORT_FILE"
if git -C "$VENDOR_DATALENS" rev-parse "$UPSTREAM_REF" >/dev/null 2>&1; then
  BEHIND="$(git -C "$VENDOR_DATALENS" rev-list --count HEAD.."$UPSTREAM_REF" 2>/dev/null || echo 0)"
  AHEAD="$(git -C "$VENDOR_DATALENS" rev-list --count "$UPSTREAM_REF"..HEAD 2>/dev/null || echo 0)"
  echo "- vendor vs $UPSTREAM_REF: behind=$BEHIND ahead=$AHEAD" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"
  echo "## Upstream shortlog (20)" | tee -a "$REPORT_FILE"
  git -C "$VENDOR_DATALENS" log -20 --oneline "$UPSTREAM_REF" | tee -a "$REPORT_FILE"
else
  echo "**SKIP:** ref \`$UPSTREAM_REF\` unavailable in vendor." | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

echo "## Overlay custom markers (YDL-OS)" | tee -a "$REPORT_FILE"
set +e
git -C "$YDL_REPO_ROOT" grep -l 'YDL-OS' -- overlay ':!vendor/**' ':!**/node_modules/**' ':!**/dist/**' 2>/dev/null | sort -u | tee -a "$REPORT_FILE"
set -e
echo "" | tee -a "$REPORT_FILE"

echo "## Compare versions" | tee -a "$REPORT_FILE"
echo '```bash' >>"$REPORT_FILE"
echo "jq . vendor/datalens/versions-config.json" >>"$REPORT_FILE"
echo "jq . overlay/platform/versions-config.json 2>/dev/null || true" >>"$REPORT_FILE"
echo "bash integration/update-vendor.sh 2.9.0   # bump vendor pin" >>"$REPORT_FILE"
echo '```' >>"$REPORT_FILE"
echo "" >>"$REPORT_FILE"

if [[ "${BUILD_CUSTOM:-}" == "1" ]]; then
  echo "## BUILD_CUSTOM=1" | tee -a "$REPORT_FILE"
  bash "$YDL_REPO_ROOT/integration/build.sh" 2>&1 | tail -40 | tee -a "$REPORT_FILE"
  echo "" >>"$REPORT_FILE"
fi

if [[ "${SMOKE:-}" == "1" ]]; then
  echo "## SMOKE=1" | tee -a "$REPORT_FILE"
  if curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 http://127.0.0.1/ping 2>/dev/null | grep -q 200; then
    echo "- GET http://127.0.0.1/ping → **200**" | tee -a "$REPORT_FILE"
  else
    echo "- GET http://127.0.0.1/ping → **fail** (nginx/UI не на :80 или недоступно с этой машины)" | tee -a "$REPORT_FILE"
  fi
  CODE="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 -X POST http://127.0.0.1/gateway/auth/auth/refreshTokens -H 'Content-Type: application/json' -d '{}' 2>/dev/null || echo 000)"
  echo "- POST /gateway/auth/auth/refreshTokens (без cookie) → **$CODE** (ожидаемо 401, не 404)" | tee -a "$REPORT_FILE"
  echo "" >>"$REPORT_FILE"
fi

if [[ "$PROFILE_VALIDATE" == "1" ]]; then
  echo "## PROFILE_VALIDATE=1" | tee -a "$REPORT_FILE"
  if python3 "$SCRIPT_DIR/dashboard-profile-engine.py" validate --profiles-dir "$PROFILES_DIR" | tee -a "$REPORT_FILE"; then
    echo "- profile validation: **pass**" | tee -a "$REPORT_FILE"
  else
    echo "- profile validation: **fail**" | tee -a "$REPORT_FILE"
    exit 3
  fi
  echo "" >>"$REPORT_FILE"
fi

{
  echo "## Дальнейшие шаги (ручной контур)"
  echo "1. Прочитать \`datalens/CUSTOMIZATION_MANIFEST.md\` и \`datalens/PLATFORM_SYNC_UPSTREAM.md\`."
  echo "2. Перенести нужные куски из \`git show $UPSTREAM_REF:…\` в \`datalens/docker-compose.yaml\` / \`versions-config.json\` / \`components/*\`."
  echo "3. Сборка кастомных образов → \`docker compose … up -d\` → смоук на тесте → коммит → push."
  echo "4. Повторный запуск этого скрипта: \`bash datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh\`"
} | tee -a "$REPORT_FILE"

echo "## Release version (upstream)" | tee -a "$REPORT_FILE"
set +e
SYNC_VER="$(bash "$SCRIPT_DIR/sync-release-version-from-upstream.sh")"
SYNC_EX=$?
set -e
if [[ "$SYNC_EX" -eq 0 ]]; then
  echo "RELEASE_VERSION=\`$SYNC_VER\` (from \`$UPSTREAM_REF\`)" | tee -a "$REPORT_FILE"
else
  echo "**WARN:** sync-release-version-from-upstream failed: $SYNC_VER" | tee -a "$REPORT_FILE"
fi
echo "" >>"$REPORT_FILE"

echo ""
echo "=== Готово ==="
echo "Отчёт: $REPORT_FILE"
