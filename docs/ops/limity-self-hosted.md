# Лимиты self-hosted (YDLOS)

**Для кого:** аналитики и администраторы.

Официальная документация: https://datalens.ru/opensource/docs/ru/concepts/limits.html

## Параметры в `.env` (YDLOS prod defaults)

| Параметр | Значение по умолчанию | Назначение |
|----------|----------------------|------------|
| `FLAT_TABLE_ROWS_LIMIT` | `100000` | Строк в плоской таблице |
| `DATA_FETCHING_TIMEOUT_MS` | `120` | Таймаут загрузки данных (с) |
| `DATA_SINGLE_FETCHING_TIMEOUT_MS` | `120` | Таймаут одного запроса |
| `UNITED_STORAGE_CONFIG_LOADED_TIMEOUT` | `10000` | US config load (мс) |
| `EXPORT_DASH_EXCEL` | `true` | Excel с дашборда |
| `EXPORT_WORKBOOK_ENABLED` | `true` | Экспорт workbook |
| `HC` | `0` | D3 вместо полного Highcharts |
| `YANDEX_MAP_ENABLED` | `1` (bi-full) | Карты (нужен токен) |
| `METRICS_ENABLED` | `1` | Метрики `/metrics` где поддерживается |

## Коннекторы

`CONNECTOR_AVAILABILITY_VISIBLE` — все OSS-источники включая MSSQL, Oracle, Trino.

## Включить всё одной командой

```bash
bash integration/enable-all-bi-features.sh overlay/platform/.env
```

Compose: `docker-compose.ydl-bi-full.yaml` подключается автоматически (`YDL_BI_FULL=1`).

## Upstream

Цель — перенести группу on-prem лимитов в official `datalens-tech/datalens` (см. `overlay/platform/upstream-rfc/`).
