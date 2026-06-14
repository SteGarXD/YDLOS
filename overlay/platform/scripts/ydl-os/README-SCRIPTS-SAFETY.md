# Скрипты US (Postgres)

Скрипты **не входят** в UI-образ и **не запускаются** при `deploy.sh` / сборке overlay.

## Удалено (2026-06) — массовые патчи БД

Следующие скрипты **удалены из репозитория**, т.к. перезаписывали все дашборды/датасеты и ломали селекторы и параметры:

- `fix-repka-all-dashboards.py`, `run-fix-repka-all-dashboards.sh`
- `fix-repka-dash1-defaults.py`, `fix-dash1-dataset-ds-default.py`
- `apply-all-dataset-parameter-defaults.py`, `run-apply-all-dataset-parameter-defaults.sh`
- `fix-repka-group-controls-auto-update.py`
- `fix-all-dash-empty-date-defaults.py`
- `restore-dataset-parameter-defaults.py`, `run-restore-dataset-parameter-defaults.sh`
- `fix-dash-dt-interval-aliases.py`

`release-full.sh`: `PATCH_REPKA` по умолчанию **0**; шаг массового патча отключён.

## Главный аудит (только чтение)

```bash
PGHOST=<postgres-ip> python3 datalens-platform-readonly-audit.py
python3 datalens-platform-readonly-audit.py --json /tmp/audit.json
```

Проверяет: параметры датасетов (defaults в Postgres), селекторы дашбордов, aliases, расхождения с моделью [DataLens](https://datalens.ru/docs/ru/), overlay-профили чартов.

## Прочие read-only

| Скрипт | Назначение |
|--------|------------|
| `repka-platform-healthcheck.py` | Краткий список aliases (legacy) |
| `audit-dash-aliases-connections.py` | connections |
| `extract-profiles-from-us.py` | Выгрузка профилей |
| `platform-governance-report.py` | Отчёт по US |

## Миграция параметров (один раз, с бэкапом)

| Скрипт | Назначение |
|--------|------------|
| `migrate-repka-parameter-constraints.py` | `value_constraint` regex `.*`, непустые defaults дат; `--apply --confirm REPKA` |

См. `overlay/platform/REPKA-PARAMETERS-CORP.md`.

## Точечные (осторожно, вручную)

| Скрипт | Назначение |
|--------|------------|
| `fix-repka-widget-field-mismatches.py` | Один виджет (например class→cls) |
| `fix-dash-group-aliases.py` | Исправление битых aliases groupid=id |
| `fix-repka-date-is-range.py` | Флаг isRange у даты |
| `dashboard-profile-engine.py` | sync профилей в entry (без mass-patch дашборда) |
| `apply-repka-chart-customization-profiles.py` | customizationProfileId на чартах |

Правки дашбордов и параметров датасетов — **в UI DataLens**, не скриптами по всей БД.

## Откат уже сделанных патчей

История ревизий в United Storage или восстановление Postgres из бэкапа.
