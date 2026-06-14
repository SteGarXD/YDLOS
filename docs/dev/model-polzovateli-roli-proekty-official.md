# Пользователи, роли, «проекты» — как в DataLens OSS (official)

**Для кого:** архитекторы и администраторы.

## Нужны ли users / roles / projects в datalens?

| Понятие | В official OSS 2.9 | Нужно? |
|---------|-------------------|--------|
| **Пользователи** | Да — `datalens-auth` + БД `pg-auth-db` | Да |
| **Роли** | Да — `datalens.admin`, `datalens.editor`, `datalens.viewer` | Да |
| **«Проекты» (akrasnov `pd_projects`)** | **Нет** как отдельная сущность | **Нет** — заменяется official-моделью |

## Как это делают разработчики datalens-tech (вместо pd_projects)

| Задача akrasnov | Official-эквивалент | Где в UI |
|-----------------|---------------------|----------|
| Изоляция команд / заказчиков | **Коллекции** + **воркбуки** | Навигация, collections |
| Кто что видит | **Права US** на workbook / connection / dataset | Share, permissions API |
| Админ пользователей | **Настройки сервиса → Пользователи** | `/settings` |
| Роли admin / viewer | **Auth roles** `datalens.*` | `/settings` |
| Мастер на всё | `datalens.admin` | assign script |
| OIDC только чтение | `datalens.viewer` при первом входе | OIDC + roles |
| «Проект» = область видимости | **Workbook** + optional **collection** tree | Не отдельная таблица `pd_projects` |

Документация Yandex: https://datalens.ru/opensource/docs/ru/security/roles.html

## YDLOS: что включено по умолчанию

```bash
YDL_USE_OFFICIAL_ADMIN=1
ENABLE_LEGACY_PD_RBAC=0
```

- UI: **Настройки сервиса**, не `/admin/*`.
- Скрипт: `assign-official-admin-role.sh` для `datalens.admin`.

## Сценарий Аэронавигатор (портал + OIDC + RLS)

Admin строит BI; внешние пользователи — OIDC viewer; один воркбук; свои дашборды (US) и свои данные (RLS).  
**Без** `pd_*` и миграции. Подробно: [scenariy-portal-oidc-us-rls.md](scenariy-portal-oidc-us-rls.md), [ydlos-master-plan.md](ydlos-master-plan.md).

## Когда включать legacy «проекты» (редко)

Только если уже есть prod на форке с `core.pd_*` и нужен переходный период:

```bash
YDL_USE_OFFICIAL_ADMIN=0
ENABLE_LEGACY_PD_RBAC=1
```

Для greenfield / official-only — **не включать**. План: [roli-i-proekty-v-ui.md](roli-i-proekty-v-ui.md).

## Корпоратив (Аэронавигатор)

Отраслевое — **L8** (`flight-groups`, profiles), не дублировать `pd_projects`.

**Итог:** пользователи и роли **нужны** (official). «Проекты» akrasnov — **не нужны** в datalens; используйте **коллекции / воркбуки / права US** — так задумано в open-source.
