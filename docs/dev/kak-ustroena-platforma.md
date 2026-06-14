# Как устроена платформа

**Для кого:** разработчики и DevOps.

## Сервисы

```text
Браузер → nginx → datalens-ui
              ├→ datalens-auth (пользователи, JWT/cookie)
              ├→ datalens-us (метаданные: воркбуки, датасеты, чарты, дашборды)
              ├→ control-api / data-api → ваши БД
              └→ postgres (pg-us-db, pg-auth-db)
```

## Объекты

| Сущность | Хранение |
|----------|----------|
| Воркбук, датасет, чарт, дашборд | US (PostgreSQL) |
| Пользователи, роли | auth DB + UI «Настройки сервиса» |
| Данные отчётов | **только в источнике** |

## Запросы

При открытии чарта/дашборда UI строит запросы в **вашу БД**. Метаданные в Postgres DataLens не дублируют витрины.

## Кольца кастома YDLOS

| Кольцо | Содержимое |
|--------|------------|
| Ring 1 | `vendor/datalens` + ghcr + compose env |
| Ring 2 | `datalens-extensions` (PR в upstream) |
| Ring 3 | `org-private/*` (корпоративное) |

## Версии

См. [vendor/datalens/versions-config.json](../../vendor/datalens/versions-config.json).
