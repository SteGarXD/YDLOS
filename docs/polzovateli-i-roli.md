# Пользователи и роли

**Для кого:** администраторы и аналитики.

Подробно: «проекты» vs коллекции/воркбуки — [dev/model-polzovateli-roli-proekty-official.md](dev/model-polzovateli-roli-proekty-official.md).

## Модель (DataLens OSS) — активна

| Роль | Возможности |
|------|-------------|
| `datalens.viewer` | Просмотр |
| `datalens.editor` | Создание и редактирование |
| `datalens.admin` | Администрирование сервиса |

Управление: **Настройки сервиса** (`/settings`) → **Пользователи**.

Документация: https://datalens.ru/opensource/docs/ru/security/roles.html

Назначить `datalens.admin` пользователю `master` на сервере:

```bash
bash overlay/platform/scripts/ydl-os/assign-official-admin-role.sh master
```

## Свои роли, проекты, несколько ролей на пользователя

В **чистом OSS** нет облачной «ролевой модели» и **проектов** как в Cloud. В YDLOS два режима:

| Задача | Official (рекомендуется) | Legacy (как akrasnov / форк) |
|--------|--------------------------|------------------------------|
| Создать пользователя | `/settings` → Пользователи | `/admin` → Users |
| Назначить admin/editor/viewer | `datalens.*` | `admin` / `datalens` + кастомные роли |
| **Своя роль** (не только 3 official) | ❌ | ✅ `/admin/roles` |
| **Проект** (изоляция команд) | коллекции + воркбуки | ✅ `/admin/projects` |

```bash
# Кастомные роли и проекты (pd_*), если бизнесу нужно именно так:
ENABLE_LEGACY_PD_RBAC=1
YDL_USE_OFFICIAL_ADMIN=0
```

После миграции процессов — снова official-only. Подробно: [dev/model-polzovateli-roli-proekty-official.md](dev/model-polzovateli-roli-proekty-official.md).

## Legacy (только при необходимости)

Если нужны старые страницы `/admin/*` и `core.pd_*`:

```bash
ENABLE_LEGACY_PD_RBAC=1
YDL_USE_OFFICIAL_ADMIN=0
```

## Вход

- Локальный логин/пароль (official auth).
- OIDC — см. [oidc.md](oidc.md).

Регистрация на prod обычно отключена (`AUTH_SIGNUP_DISABLED`).

## Кому звонить

Права на объекты, новые пользователи — администратор BI. Технические сбои — DevOps ([ops/ustranenie-neispravnostey.md](ops/ustranenie-neispravnostey.md)).
