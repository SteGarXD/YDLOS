# Очередь PR в datalens-tech (фаза E — не отправлено)

Подготовка: `bash integration/upstream-prepare-pr.sh`

| P | Тема | Репозиторий |
|---|------|-------------|
| P0 | On-prem лимиты env | datalens |
| P0 | MSSQL connector | datalens-backend |
| P0 | QL `__user_id` / `__embed` | datalens-ui |
| P0 | OSS signin path | datalens-ui |
| P0 | Multi-OIDC compose | datalens |

После merge каждого PR — удалить соответствующий модуль из overlay (`overlay-inventory.md`).
