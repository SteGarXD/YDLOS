# Администрирование

**Для кого:** администраторы BI.

## Пользователи

1. Войти под учёткой с правами администратора.
2. Открыть **Настройки сервиса** → **Пользователи**.
3. Создать пользователя, назначить роль `datalens.viewer` / `editor` / `admin`.

Официальная инструкция: https://datalens.ru/opensource/docs/ru/security/manage-users.html

## Переменные окружения (задаёт DevOps)

| Переменная | Назначение |
|------------|------------|
| `AUTH_SIGNUP_DISABLED` | Запрет саморегистрации |
| `EXPORT_DASH_EXCEL` | Экспорт дашборда в Excel |
| `FLAT_TABLE_ROWS_LIMIT` | Лимит строк плоской таблицы |
| `OIDC*` | Корпоративный SSO |
| `ENABLE_LEGACY_PD_RBAC` | Legacy-мост pd_* (временно) |

Полный список: [ops/limity-self-hosted.md](ops/limity-self-hosted.md), `.env` на сервере.

## Резервное копирование

См. [ops/rezervnoe-kopirovanie.md](ops/rezervnoe-kopirovanie.md).

## Runbook

Инженерные процедуры: [overlay/platform/docs/OPERATING_MODEL.md](../overlay/platform/docs/OPERATING_MODEL.md).
