#!/usr/bin/env bash
# ============================================================
# YDL OS — цикл синхронизации с upstream (datalens-tech/datalens)
# ============================================================
# Не выполняет «магический merge» несовместимых деревьев: фиксирует факты,
# пишет отчёт, опционально собирает кастомные образы и смоук-тестирует стек.
#
# Запуск из любого cwd:
#   bash /path/to/datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh
#
# Переменные окружения:
#   FETCH_ONLY=1       — только git fetch + отчёт (по умолчанию, если не задано иное)
#   BUILD_CUSTOM=1     — после отчёта: docker build UI + auth (см. пути ниже)
#   COMPOSE_DIR=/opt/ydl-os  — если задан и SMOKE=1: curl /ping на localhost:80
#   SMOKE=1            — смоук (нужен COMPOSE_DIR или уже поднятый nginx на :80)
#   UPSTREAM_REF=upstream/main  — ветка/тег для сравнения
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INNER_DATALENS="$(cd "$SCRIPT_DIR/../.." && pwd)"
MONO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
UPSTREAM_REF="${UPSTREAM_REF:-upstream/main}"
REPORT_DIR="$INNER_DATALENS/reports"
TS="$(date -u +%Y%m%d-%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/upstream-sync-${TS}.md"

mkdir -p "$REPORT_DIR"
cd "$MONO_ROOT"

{
  echo "# Upstream sync report ($TS)"
  echo
  echo "- Mono root: \`$MONO_ROOT\`"
  echo "- Inner datalens: \`$INNER_DATALENS\`"
  echo "- Upstream ref: \`$UPSTREAM_REF\`"
  echo
} >"$REPORT_FILE"

echo "=== YDL OS upstream sync ==="
echo "MONO_ROOT=$MONO_ROOT"
echo "Report: $REPORT_FILE"
echo ""

if ! git -C "$MONO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not a git repository: $MONO_ROOT" | tee -a "$REPORT_FILE"
  exit 1
fi

echo "## Git remotes" | tee -a "$REPORT_FILE"
git -C "$MONO_ROOT" remote -v | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

echo "## git fetch" | tee -a "$REPORT_FILE"
set +e
git -C "$MONO_ROOT" fetch upstream --prune 2>&1 | tee -a "$REPORT_FILE"
FE_UP=$?
git -C "$MONO_ROOT" fetch origin --prune 2>&1 | tee -a "$REPORT_FILE"
FE_OR=$?
set -e
if [[ "$FE_UP" -ne 0 ]]; then
  echo "**WARN:** \`git fetch upstream\` exited $FE_UP (сеть, credentials или remote upstream не настроен)." >>"$REPORT_FILE"
fi
if [[ "$FE_OR" -ne 0 ]]; then
  echo "**WARN:** \`git fetch origin\` exited $FE_OR." >>"$REPORT_FILE"
fi
echo "" >>"$REPORT_FILE"

echo "## Merge-base с upstream" | tee -a "$REPORT_FILE"
set +e
MB="$(git -C "$MONO_ROOT" merge-base HEAD "$UPSTREAM_REF" 2>/dev/null)"
MB_EX=$?
set -e
if [[ "$MB_EX" -ne 0 || -z "${MB:-}" ]]; then
  {
    echo "Общего предка с \`$UPSTREAM_REF\` **нет** (ожидаемо для форка с отдельной историей)."
    echo "Полноценный \`git merge $UPSTREAM_REF\` **не применим** — переносите изменения выборочно (см. \`PLATFORM_SYNC_UPSTREAM.md\`)."
  } | tee -a "$REPORT_FILE"
else
  echo "merge-base: \`$MB\`" | tee -a "$REPORT_FILE"
fi
echo "" | tee -a "$REPORT_FILE"

echo "## Текущая ветка и HEAD" | tee -a "$REPORT_FILE"
git -C "$MONO_ROOT" status -sb | tee -a "$REPORT_FILE"
git -C "$MONO_ROOT" log -1 --oneline | tee -a "$REPORT_FILE"
echo "" | tee -a "$REPORT_FILE"

if git -C "$MONO_ROOT" rev-parse "$UPSTREAM_REF" >/dev/null 2>&1; then
  echo "## Upstream shortlog (20 коммитов)" | tee -a "$REPORT_FILE"
  git -C "$MONO_ROOT" log -20 --oneline "$UPSTREAM_REF" | tee -a "$REPORT_FILE"
  echo "" | tee -a "$REPORT_FILE"

  echo "## Файлы с маркером кастома \`YDL-OS\` (сохранить при переносе)" | tee -a "$REPORT_FILE"
  set +e
  git -C "$MONO_ROOT" grep -l 'YDL-OS' -- ':!**/node_modules/**' ':!**/dist/**' ':!**/dist-out/**' 2>/dev/null | sort -u | tee -a "$REPORT_FILE"
  set -e
  echo "" | tee -a "$REPORT_FILE"

  echo "## Подсказка: сравнить compose и версии" | tee -a "$REPORT_FILE"
  echo '```bash' >>"$REPORT_FILE"
  echo "git -C \"$MONO_ROOT\" show $UPSTREAM_REF:docker-compose.yaml | less   # если путь в upstream другой — см. официальный репо" >>"$REPORT_FILE"
  echo "git -C \"$MONO_ROOT\" show $UPSTREAM_REF:versions-config.json 2>/dev/null | less || true" >>"$REPORT_FILE"
  echo '```' >>"$REPORT_FILE"
  echo "" >>"$REPORT_FILE"
else
  echo "**SKIP:** ref \`$UPSTREAM_REF\` недоступен после fetch." | tee -a "$REPORT_FILE"
fi

if [[ "${BUILD_CUSTOM:-}" == "1" ]]; then
  echo "## BUILD_CUSTOM=1" | tee -a "$REPORT_FILE"
  echo "Сборка \`datalens-ui\` и \`datalens-auth\` …" | tee -a "$REPORT_FILE"
  sudo -n true 2>/dev/null || true
  if [[ -d "$MONO_ROOT/components/datalens-ui" ]]; then
    docker build -t akrasnov87/datalens-ui:0.3498.0 "$MONO_ROOT/components/datalens-ui" 2>&1 | tail -30 | tee -a "$REPORT_FILE"
  fi
  if [[ -d "$MONO_ROOT/components/datalens-auth" ]]; then
    docker build -f "$MONO_ROOT/components/datalens-auth/Dockerfile" -t akrasnov87/datalens-auth:0.2.6 "$MONO_ROOT/components/datalens-auth" 2>&1 | tail -20 | tee -a "$REPORT_FILE"
  fi
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

{
  echo "## Дальнейшие шаги (ручной контур)"
  echo "1. Прочитать \`datalens/CUSTOMIZATION_MANIFEST.md\` и \`datalens/PLATFORM_SYNC_UPSTREAM.md\`."
  echo "2. Перенести нужные куски из \`git show $UPSTREAM_REF:…\` в \`datalens/docker-compose.yaml\` / \`versions-config.json\` / \`components/*\`."
  echo "3. Сборка кастомных образов → \`docker compose … up -d\` → смоук на тесте → коммит → push."
  echo "4. Повторный запуск этого скрипта: \`bash datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh\`"
} | tee -a "$REPORT_FILE"

echo ""
echo "=== Готово ==="
echo "Отчёт: $REPORT_FILE"
