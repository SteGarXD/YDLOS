# Документация YDL OS

Краткий индекс production-документов.

## Операция и обновления

- [`../README.md`](../README.md) - главный runtime-entrypoint
- [`UPSTREAM_UPDATE_AND_SECURITY.md`](UPSTREAM_UPDATE_AND_SECURITY.md) - безопасный процесс обновления от upstream
- [`PRODUCTION_SENIOR_PLAYBOOK.md`](PRODUCTION_SENIOR_PLAYBOOK.md) - production-практики

## Кастомизация и совместимость

- [`../CUSTOMIZATION_MANIFEST.md`](../CUSTOMIZATION_MANIFEST.md) - где хранится кастомный слой
- [`../CHARTS_AND_LICENSES.md`](../CHARTS_AND_LICENSES.md) - Highcharts policy

## Данные и восстановление

- [`DATA-PERSISTENCE.md`](DATA-PERSISTENCE.md) - модель хранения метаданных
- [`../BACKUP_AND_RESTORE.md`](../BACKUP_AND_RESTORE.md) - регламент backup/restore
- [`../DOCKER-BACKUP.md`](../DOCKER-BACKUP.md) - полный Docker backup

## Security gate

- [`../security-baseline.json`](../security-baseline.json) - baseline Trivy
- отчёты: `../reports/security/`
