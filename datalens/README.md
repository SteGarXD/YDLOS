# YDL OS: runtime и эксплуатация

Этот каталог содержит production-runtime платформы Aeronavigator BI (YDL OS): docker compose, скрипты синхронизации/деплоя, backup-процедуры и runbook-документацию.

## 1) Что здесь находится

- production-compose стек и override-файлы
- скрипты синхронизации с upstream и деплоя
- регламенты эксплуатации и безопасности
- процедуры backup/restore

## 2) Базовый runtime

- Базовый compose: `datalens/docker-compose.yaml`
- Production override: `datalens/docker-compose.production.yaml`
- Edge proxy: `ydl-os-nginx` (host `:80` -> внутренний UI)
- Основное постоянное хранилище: Docker volume `datalens-volume-prod`

## 3) Обязательные документы оператора

- Синхронизация с upstream: [`PLATFORM_SYNC_UPSTREAM.md`](PLATFORM_SYNC_UPSTREAM.md)
- Карта кастомизаций: [`CUSTOMIZATION_MANIFEST.md`](CUSTOMIZATION_MANIFEST.md)
- Политика обновлений и безопасности: [`docs/UPSTREAM_UPDATE_AND_SECURITY.md`](docs/UPSTREAM_UPDATE_AND_SECURITY.md)
- Production playbook: [`docs/PRODUCTION_SENIOR_PLAYBOOK.md`](docs/PRODUCTION_SENIOR_PLAYBOOK.md)
- Актуальный аудит платформы: [`docs/PLATFORM_AUDIT_2026-05-15.md`](docs/PLATFORM_AUDIT_2026-05-15.md)

Рекомендуемое разбиение runbook-документов:

- [`RUNBOOK_PROD.md`](RUNBOOK_PROD.md)
- [`RUNBOOK_DEV.md`](RUNBOOK_DEV.md)
- [`AUTH_MODES.md`](AUTH_MODES.md)
- [`BACKUP_AND_RESTORE.md`](BACKUP_AND_RESTORE.md)

## 4) Стандартный production-деплой

Из серверной рабочей копии:

```bash
cd /home/g.stepanov/datalens/datalens
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d --force-recreate
```

Из снимка `GitHub main` (`SteGarXD/YDLOS`):

```bash
bash scripts/ydl-os/redeploy-from-github-main.sh
```

Источник деплоя фиксируется в:

- `/opt/ydl-os/.ydl-deploy-source`

## 5) Регулярный цикл sync -> build -> smoke -> deploy

Ручной запуск:

```bash
bash scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh
```

Что делает автопилот:

1. Проверяет дивергенцию `upstream/main` vs `github/main`.
2. Если есть отставание, обновляет `github/main` snapshot-коммитом на базе `upstream/main`.
3. Выполняет redeploy из `github/main`.
4. Прогоняет smoke-checks.
5. Пишет отчёт в `datalens/reports/autopilot/`.

## 6) Ночной регламент

Включает:

- отчёт ahead/behind
- nightly dump БД US
- ротацию backup/отчётов
- smoke-checks

Установка cron:

```bash
bash scripts/ydl-os/install-nightly-cron.sh
```

Ручной запуск:

```bash
bash scripts/ydl-os/nightly-maintenance.sh
```

## 7) Минимальная backup-политика

Перед любым платформенным обновлением:

1. создать PostgreSQL dump;
2. сохранить пару проверенных backup-файлов (latest + previous);
3. проверить сценарий восстановления.

Рабочие каталоги backup:

- `datalens/backups/`
- `datalens/backups/preserved-development/`
- `datalens/backups/nightly/`

## 8) Безопасность при разных auth-режимах

При отключённом облачном auth-контуре обязательны компенсирующие меры:

- периметр (VPN/IP allowlist);
- регулярная ротация секретов;
- централизованные логи и алерты;
- регулярные учения по восстановлению.

Подробно:

- [`docs/UPSTREAM_UPDATE_AND_SECURITY.md`](docs/UPSTREAM_UPDATE_AND_SECURITY.md)
- [`docs/PRODUCTION_SENIOR_PLAYBOOK.md`](docs/PRODUCTION_SENIOR_PLAYBOOK.md)
