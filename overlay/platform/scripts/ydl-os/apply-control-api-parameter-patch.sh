#!/usr/bin/env bash
# YDL OS patches for control-api + data-api (TVF params, SQL quoting, validation).
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
YDL_REPO_ROOT="${YDL_REPO_ROOT:-$(cd "${_SCRIPT_DIR}/../../../.." && pwd)}"
_BACKEND="${YDL_REPO_ROOT}/overlay/components/datalens-backend/lib"
REPO_CORE="${REPO_CORE:-${_BACKEND}/dl_core/dl_core}"
REPO_API="${REPO_API:-${_BACKEND}/dl_api_lib/dl_api_lib}"
REPO_QP="${REPO_QP:-${_BACKEND}/dl_query_processing/dl_query_processing}"
REPO_MSSQL="${REPO_MSSQL:-${_BACKEND}/dl_connector_mssql/dl_connector_mssql}"
REPO_PREP="${REPO_PREP:-${_BACKEND}/dl_core/dl_core/data_processing/prepared_components}"
PATCH_DIR="${PATCH_DIR:-${YDL_COMPOSE_DIR}/patches}"
VENV_DL="/venv/lib/python3.10/site-packages/dl_core"
VENV_API="/venv/lib/python3.10/site-packages/dl_api_lib"
VENV_QP="/venv/lib/python3.10/site-packages/dl_query_processing"
VENV_MSSQL="/venv/lib/python3.10/site-packages/dl_connector_mssql"

mkdir -p "$PATCH_DIR"
install -m 0644 "$REPO_CORE/fields.py" "$PATCH_DIR/dl_core_fields.py"
install -m 0644 "$REPO_CORE/data_source/base.py" "$PATCH_DIR/dl_core_data_source_base.py"
install -m 0644 "$REPO_CORE/components/accessor.py" "$PATCH_DIR/dl_core_accessor.py"
install -m 0644 "$REPO_API/dataset/validator.py" "$PATCH_DIR/dl_api_lib_validator.py"
install -m 0644 "$REPO_QP/compilation/formula_compiler.py" "$PATCH_DIR/dl_query_processing_formula_compiler.py"
install -m 0644 "$REPO_MSSQL/core/query_compiler.py" "$PATCH_DIR/dl_connector_mssql_query_compiler.py"
install -m 0644 "$REPO_PREP/default_manager.py" "$PATCH_DIR/dl_core_default_manager.py"

for c in datalens-control-api-prod datalens-data-api-prod; do
  if docker ps --format '{{.Names}}' | grep -qx "$c"; then
    docker cp "$PATCH_DIR/dl_core_fields.py" "$c:$VENV_DL/fields.py"
    docker cp "$PATCH_DIR/dl_core_data_source_base.py" "$c:$VENV_DL/data_source/base.py"
    docker cp "$PATCH_DIR/dl_core_accessor.py" "$c:$VENV_DL/components/accessor.py"
    docker cp "$PATCH_DIR/dl_api_lib_validator.py" "$c:$VENV_API/dataset/validator.py"
    docker cp "$PATCH_DIR/dl_query_processing_formula_compiler.py" "$c:$VENV_QP/compilation/formula_compiler.py"
    # query_compiler + default_manager may be bind-mounted on data-api (skip busy file).
    docker cp "$PATCH_DIR/dl_connector_mssql_query_compiler.py" "$c:$VENV_MSSQL/core/query_compiler.py" 2>/dev/null \
      || echo "skip mssql query_compiler copy for $c (bind-mount or busy)"
    if [ "$c" = "datalens-data-api-prod" ]; then
      docker cp "$PATCH_DIR/dl_core_default_manager.py" \
        "$c:$VENV_DL/data_processing/prepared_components/default_manager.py" 2>/dev/null \
        || echo "skip default_manager copy for $c (bind-mount or busy)"
    fi
    docker exec "$c" find /venv/lib/python3.10/site-packages/dl_api_lib/dataset \
      /venv/lib/python3.10/site-packages/dl_query_processing/compilation \
      /venv/lib/python3.10/site-packages/dl_connector_mssql/core \
      /venv/lib/python3.10/site-packages/dl_core/data_processing/prepared_components \
      -name '*.pyc' -delete 2>/dev/null || true
    echo "patched $c (dl_core + validator + formula_compiler + mssql query_compiler + default_manager)"
  fi
done

docker restart datalens-control-api-prod datalens-data-api-prod 2>/dev/null || true
echo "control-api + data-api restarted (YDL OS backend patches applied)"
