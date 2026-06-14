# UI overlay strategy (YDLOS)

## Модель (как вы хотели)

```
┌─────────────────────────────────────────┐
│  YDL overlay (corp + улучшения)       │  ← PR в datalens-tech, слой сжимается
├─────────────────────────────────────────┤
│  ghcr datalens-ui:<uiVersion> (ядро)    │  ← не форк, не трогаем исходники
└─────────────────────────────────────────┘
```

- **Ядро** — официальный UI из `datalens-tech/datalens-ui`, образ `ghcr.io/datalens-tech/datalens-ui`.
- **Overlay** — маленькие модули в `overlay/patches/datalens-ui/`, накладываются при сборке.
- **Ничего не «затираем» bulk’ом** — официальные файлы в worktree остаются, поверх копируются только явные модули/манифесты.
- **Bulk overlay-client/server/shared** — **удалены (0 файлов)**; только модули L0–L3.
- **Legacy AW/akrasnov** — удалено из git.

## Tiers client (`YDL_UI_CLIENT_TIER`)

| Tier | Сборка client | Содержимое |
|------|---------------|------------|
| `none` | нет | Только server → на экране «Yandex DataLens» |
| `branding` | да | Имя, logo, sidebar без /auth |
| **`corp`** | **да (prod)** | branding + синие иконки дашбордов + редактор групп + группы визуализаций |
| **`all`** / `features` / `full` | да | **идентично `corp`** — один manifest, 0 bulk |

Prod default: **`corp`**. См. **`docs/dev/overlay-etalon-bulk.md`**.

```bash
YDL_UI_CLIENT_TIER=corp bash integration/publish-ui-overlay-dist.sh
```

## Server modules (всегда, быстро)

| Модуль | Назначение |
|--------|------------|
| `ydl-config`, `layout-branding` | `SERVICE_NAME`, `window.DL.*` |
| `charts-engine-run`, `charts-params` | MSSQL, `__user_id`, параметры датасетов |
| `us-corporate`, `ydl-routes` | RPC, flight-groups API |

## Client modules (corp)

| Модуль | Файлов | Назначение |
|--------|--------|------------|
| `client-branding/` | 3 | Signin, LogoText, datalens shell |
| `client-features/` | ~6 | entity colors, VisualizationSelector groups, DashActionPanel |
| `ydl-only/` | flight editor | API, кнопка, i18n |

## Статус по вашим пунктам (май 2026)

| # | Запрос | Статус |
|---|--------|--------|
| 1 | Стратегия / tier branding | **branding нужен** для имени на auth (server-only недостаточно). Prod = **corp** |
| 2 | Пересмотр 700+ overlay-diff | **В процессе**: инвентарь `integration/generate-overlay-inventory.sh`, перенос в модули, не bulk |
| 3 | Пустые параметры | **Server**: `charts-params` в образе. **Client refresh селекторов** после редактора — упрощён (reload/load), полный bump — из overlay-diff позже |
| 4 | Секции визуализаций | **Сделано** в corp: `VisualizationSelector` + Collapse |
| 5 | Иконки дашбордов vs чартов | **Сделано**: только `--dl-color-entity-dashboard` (`#6ec8ff`); чарты — официальные цвета |
| 6 | Редактор групп на dash | **Сделано** в corp; видна на вкладках с селектором группы |

## Обновление upstream

```bash
bash integration/bump-upstream-ui.sh main
bash integration/verify-overlay-health.sh
```

Playbook: **`docs/dev/platform-update-playbook.md`**. Roadmap: **`overlay/REMAINING_IDEAL.md`**.

При конфликте — правим только файлы в overlay-модулях, не `.cache/datalens-ui/`.

## Legacy (не использовать в prod)

- `overlay-diff/` bulk
- `akrasnov-rpc`, `legacy-rbac-compat`
