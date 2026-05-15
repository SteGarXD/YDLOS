# YDL OS Runtime

Операционный entrypoint для production-каталога `datalens/`.

## Назначение

- запуск и обновление production-стека;
- контролируемая синхронизация с upstream;
- backup/restore и security-процедуры;
- фиксация источника деплоя.

## Production-контур

- compose: `docker-compose.yaml` + `docker-compose.production.yaml`
- edge proxy: `ydl-os-nginx`
- persistent storage: volume `datalens-volume-prod`
- источник релиза: `github/main` (`SteGarXD/YDLOS`)

## Ключевые документы

- sync-модель: [`PLATFORM_SYNC_UPSTREAM.md`](PLATFORM_SYNC_UPSTREAM.md)
- карта кастома: [`CUSTOMIZATION_MANIFEST.md`](CUSTOMIZATION_MANIFEST.md)
- production runbook: [`RUNBOOK_PROD.md`](RUNBOOK_PROD.md)
- auth-режимы: [`AUTH_MODES.md`](AUTH_MODES.md)
- backup/restore: [`BACKUP_AND_RESTORE.md`](BACKUP_AND_RESTORE.md)
- security-процессы: [`docs/PRODUCTION_SENIOR_PLAYBOOK.md`](docs/PRODUCTION_SENIOR_PLAYBOOK.md)

## Обновление платформы (рекомендуемый путь)

```bash
bash scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh
```

Автопилотный цикл:

1. синхронизация с upstream;
2. сборка образов с `--pull`;
3. smoke-check;
4. redeploy из `github/main`;
5. security scan и gate по baseline.

## Фиксация источника деплоя

После каждого redeploy:

```bash
sed -n '1,20p' /opt/ydl-os/.ydl-deploy-source
```

Ожидаемо:

- `source=github/main`
- `commit=<sha>`
