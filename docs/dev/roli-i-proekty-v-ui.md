# Роли и «проекты» в UI

## Режим по умолчанию (official 2.9) — рекомендуется

| В .env | UI |
|--------|-----|
| `YDL_USE_OFFICIAL_ADMIN=1` | Админка: **Настройки сервиса** (`/settings`) |
| `ENABLE_LEGACY_PD_RBAC=0` | Нет `/admin` и `pd_*` bridge |

**Роли:** `datalens.admin`, `datalens.editor`, `datalens.viewer` (official auth + US).

**Проекты** в смысле akrasnov (`core.pd_projects`) — **не** часть official UI. Изоляция — **коллекции / воркбуки / права US** на объекты.

Назначение admin:

```bash
bash overlay/platform/scripts/ydl-os/assign-official-admin-role.sh master
```

## Рекомендуемый сценарий (Аэронавигатор)

Admin + OIDC viewer + workbook «Портал» + US + RLS — **без legacy**.  
[scenariy-portal-oidc-us-rls.md](scenariy-portal-oidc-us-rls.md)

## Legacy parity (akrasnov: master, admin, проекты, pd_roles)

Только если уже есть prod на форке с `pd_*`:

```bash
YDL_USE_OFFICIAL_ADMIN=0
ENABLE_LEGACY_PD_RBAC=1
```

| UI | Функция |
|----|---------|
| `/admin/users`, `/admin/roles`, `/admin/projects` | `core.pd_*` через `legacy-rbac-compat` |
| Мастер / admin / datalens / oidc | таблицы legacy auth |

**Минусы:** второй контур прав, сложнее обновления → цель — миграция на service-settings.

## OIDC-пользователи

Роль `datalens` (viewer) по умолчанию; настройка через official roles или legacy `pd_roles` — см. [feature-registry.md](feature-registry.md).

## Share / связанные объекты

Работают в overlay при official auth; smoke после смены auth — [OSS_EXTENDED_FEATURES_SMOKE.md](../../overlay/platform/docs/OSS_EXTENDED_FEATURES_SMOKE.md).
