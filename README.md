# YDL OS (Aeronavigator BI)

Форк [datalens-tech/datalens](https://github.com/datalens-tech/datalens) для production-эксплуатации BI-платформы с кастомным UI/Auth и операционными скриптами.

## Структура репозитория

- `components/` — исходники сервисов (`datalens-ui`, `datalens-auth`, `datalens-us`, backend-библиотеки)
- `datalens/` — деплой, runbook-документация, операционные скрипты и инфраструктурные файлы

## Быстрые ссылки

- Главный runtime-runbook: [`datalens/README.md`](datalens/README.md)
- Карта кастомизаций: [`datalens/CUSTOMIZATION_MANIFEST.md`](datalens/CUSTOMIZATION_MANIFEST.md)
- Синхронизация с upstream: [`datalens/PLATFORM_SYNC_UPSTREAM.md`](datalens/PLATFORM_SYNC_UPSTREAM.md)
- Production/безопасность: [`datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md`](datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md)
- Аудит платформы: [`datalens/docs/PLATFORM_AUDIT_2026-05-15.md`](datalens/docs/PLATFORM_AUDIT_2026-05-15.md)

## Публичный контур

- URL: [https://bi.aeronavigator.ru](https://bi.aeronavigator.ru)
- Edge-схема: host Nginx -> внутренний `ydl-os-nginx` (`:80`)

## Стандарт качества изменений

1. Изменения кода и документации идут вместе.
2. Для операторов добавляется раздел миграции/обновления.
3. Для деплоя добавляются smoke-checks и сценарий rollback.
4. Сообщения коммитов — короткие, фактические, без лишнего текста.
