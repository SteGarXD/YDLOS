# YDL OS (Aeronavigator BI)

Production-форк DataLens для корпоративной BI-платформы.

## Происхождение форка

Репозиторий продолжает ветку кастомизаций:

1. официальный upstream: [`datalens-tech/datalens`](https://github.com/datalens-tech/datalens)
2. базовый прикладной форк: [`akrasnov87/datalens`](https://github.com/akrasnov87/datalens)
3. текущая production-линия: `SteGarXD/YDLOS`

Это важно: часть архитектурных и auth-решений намеренно унаследована от форка `akrasnov87` и поддерживается как совместимый слой.

## Что в репозитории

- `components/` — исходники сервисов (`datalens-ui`, `datalens-auth`, `datalens-us`, backend-библиотеки)
- `datalens/` — production-runtime: compose, runbook, скрипты sync/deploy/backup/security

## Для быстрого старта

- Runtime и эксплуатация: [`datalens/README.md`](datalens/README.md)
- Карта кастомизаций: [`datalens/CUSTOMIZATION_MANIFEST.md`](datalens/CUSTOMIZATION_MANIFEST.md)
- Синхронизация с upstream: [`datalens/PLATFORM_SYNC_UPSTREAM.md`](datalens/PLATFORM_SYNC_UPSTREAM.md)
- Production/безопасность: [`datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md`](datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md)

## Модель обновлений UI (важно)

В проекте используется модель:

- **свежий официальный upstream UI** как базовый слой;
- **кастомный UI** (брендинг, auth-потоки, операционные правки) как управляемый overlay;
- регулярный цикл `sync -> build -> smoke -> deploy` обязателен и автоматизирован.

Это позволяет брать новые изменения upstream без потери ваших кастомизаций.
