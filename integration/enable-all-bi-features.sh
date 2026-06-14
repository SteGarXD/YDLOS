#!/usr/bin/env bash
# Merge recommended BI env into overlay/platform/.env (idempotent keys).
set -euo pipefail

ENV_FILE="${1:-$(dirname "$0")/../overlay/platform/.env.example}"
[[ -f "$ENV_FILE" ]] || { echo "missing $ENV_FILE"; exit 1; }

set_kv() {
  local k="$1" v="$2"
  if grep -q "^${k}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${k}=.*|${k}=${v}|" "$ENV_FILE"
  else
    echo "${k}=${v}" >>"$ENV_FILE"
  fi
}

set_kv EXPORT_WORKBOOK_ENABLED true
set_kv EXPORT_DASH_EXCEL true
set_kv YDL_FEATURES_ALL_BI 1
set_kv YDL_USE_OFFICIAL_ADMIN 1
set_kv ENABLE_LEGACY_PD_RBAC 0
set_kv FLAT_TABLE_ROWS_LIMIT 100000
set_kv METRICS_ENABLED 1
set_kv HC 0
set_kv CONNECTOR_AVAILABILITY_VISIBLE 'clickhouse,postgres,chyt,ydb,mysql,greenplum,mssql,oracle,trino,appmetrica_api,metrika_api'

echo "OK: BI defaults applied to $ENV_FILE"
