# OSS-расширения YDLOS

Источники: [datalens-tech/datalens](https://github.com/datalens-tech/datalens) (vendor), [official OSS docs](https://datalens.ru/opensource/docs/ru/).

Историческая спецификация возможностей (внешний репозиторий): одна ссылка в архиве плана — не дублировать в коде.

## Модель

| Слой | YDLOS |
|------|-------|
| Platform | vendor **2.9.0**, ghcr |
| Auth | official **0.27** + cookie |
| US | **1.39** |
| UI overlay | extensions, rebase @ uiVersion |

## Матрица возможностей

| # | Возможность | Реализация | Уровень L |
|---|-------------|------------|-----------|
| 1 | Обязательный вход | `AUTH_ENABLED`, official auth | L1 |
| 2 | OIDC | compose `OIDC*` | L1 |
| 3 | Роли | **Цель:** `datalens.*` + service-settings | L2 |
| 4 | Админка users | **INTERIM:** `legacy-rbac-compat` → `core.pd_*` | L7 → L2 |
| 5 | Связанные объекты | UI overlay | L5 / UPSTREAM |
| 6 | Share view-only | official + overlay align | L4 |
| 7 | QL `__user_id`, `__embed` | charts-engine | L6 PR |
| 8 | Excel дашборда | `EXPORT_DASH_EXCEL` | L1 |
| 9 | PDF D3 | overlay print | L6 PR |

## PRIVATE (Аэронавигатор)

- Flight Groups Editor, MSSQL env
- Dashboard profiles (`overlay/platform/profiles/`)
- Branding `SERVICE_NAME`

## Не переносить

- Старый release 2.7 / US 0.413 как runtime
- Образы стороннего registry как prod default
- Три auth-модели одновременно

См. [overlay-inventory.md](overlay-inventory.md), [NAMING_POLICY.md](NAMING_POLICY.md).
