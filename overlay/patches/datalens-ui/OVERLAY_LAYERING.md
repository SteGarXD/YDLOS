# Overlay layering — как накладывать кастомное на официальный DataLens

Цель: **корпоративное стабильно**, **улучшения платформы уходят в upstream PR**, bump тега не ломает org-workbooks.

## Три слоя (не смешивать)

| Слой | Где | Кто владеет |
|------|-----|-------------|
| **United Storage** | Postgres `pg-us-db`, published revisions | Редактор DataLens + профили `DashboardProfile` |
| **Официальный vendor** | `vendor/datalens/versions-config.json` → tag `datalens-ui` | `datalens-tech/datalens-ui` |
| **Overlay YDLOS** | `overlay/patches/datalens-ui/<module>/src/…` | Organization / YDL OS |

Правило: **данные и связи селекторов — в US**; **поведение UI — в overlay**; **общие фиксы платформы — PR в upstream**, затем удаление из overlay.

## Как файл попадает в сборку

```
.cache/datalens-ui/v{tag}/     ← чистый checkout тега
        ↓ rsync (порядок модулей, см. MODULE_APPLY_ORDER.txt)
        ↓ i18n-keysets jq merge
        ↓ git apply integration/lib/patches/datalens-ui/*.patch
        ↓ manifest tier (corp/branding) — второй проход
        ↓ patch-repka-dialog-parameter.sh — хирургическая вставка
dist/ → Docker UI image
```

**Поздний модуль перезаписывает ранний** при совпадении пути. Один путь — один владелец в `src/`.

## Классы патчей

| Class | Смысл | Действие после merge в upstream |
|-------|--------|----------------------------------|
| **UPSTREAM** | Улучшение для всех пользователей DataLens | PR → удалить файл/модуль из overlay |
| **INTERIM** | Временно, пока PR не принят | Следить за очередью в `docs/dev/platform-update-playbook.md` |
| **PRIVATE** | Только Organization / org-workbooks | Остаётся; обязателен **gate** |

См. классификацию по модулям: `CORPORATE_PATCHES.md`.

## Четыре способа правки (от лучшего к худшему)

1. **Данные в US** — параметры, aliases, `connections`, `dependentSelectors` в revision дашборда.
2. **Git patch** (`integration/lib/patches/datalens-ui/*.patch`) — 5–50 строк в upstream-файле.
3. **Хирургический скрипт** — `patch-repka-dialog-parameter.sh` (вставка в `dialog.ts`).
4. **Модуль `src/`** — целый файл или дерево; для крупного — **gate** + отдельный модуль.
5. ~~Полная копия upstream-файла~~ — только если нет extension point; помечать `OVERLAY(PRIVATE|UPSTREAM)` и план слияния.

### Заголовок в коде (обязательно для новых файлов)

```ts
// OVERLAY(PRIVATE): org-workbooks profile selector UI-lock; gated by shouldApplyProfileSelectorCascade.
// OVERLAY(UPSTREAM): month granularity in Datepicker — PR candidate datalens-tech#….
```

## Gates (vanilla DataLens не трогаем)

| Gate | Файл | Когда срабатывает |
|------|------|-------------------|
| `shouldApplyCorpDashRuntime` | `corp-dash-profile/.../corpRuntimeGate.ts` | `ydlProfile` или маркеры org-workbooks в config |
| `shouldApplyProfileSelectorCascade` | `corp-dash-profile/.../profileSelectorCascade.ts` | то же + селекторы |
| `migrateCorpDashDataSettings` | `migrateCorpDashSettings.ts` | `dependentSelectors: true` только для corp |

Без сигнала — **поведение 100% upstream**.

## Владение путями (path ownership)

См. `MODULE_APPLY_ORDER.txt`. Конфликты проверяет `integration/verify-overlay-health.sh`.

Пример: `GroupControl/Control/Control.tsx` — **только** `corp-selector-cascade` (включает date granularity из `client-date-controls`). В `client-date-controls` этот путь **не дублировать**.

## Добавить корпоративную фичу

1. Выбрать модуль (`PRIVATE` → `corp-*` / `ydl-only`; общее → `client-features` как **UPSTREAM**).
2. Файл под `overlay/patches/datalens-ui/<module>/src/<путь как в datalens-ui>/`.
3. Если не для всех дашбордов — gate в `corpRuntimeGate.ts` или profile spec.
4. Строка в `integration/lib/corporate-client-corp-manifest.txt` (документация + tier apply).
5. `bash integration/verify-overlay-health.sh`
6. При логике селекторов — `overlay/platform/tests/test_profile_selector_cascade.py`

## Отправить улучшение в официальный DataLens

1. Выделить **минимальный diff** против чистого тега:
   ```bash
   UI_VER=$(jq -r .uiVersion vendor/datalens/versions-config.json)
   diff -u .cache/datalens-ui/v${UI_VER}/src/path/to/file \
           overlay/patches/datalens-ui/client-date-controls/src/path/to/file
   ```
2. PR в `datalens-tech/datalens-ui` без org-workbooks-специфики (без `groupname`, без `ydlProfile`).
3. После merge — удалить файл из overlay, bump tag, `verify-overlay-health.sh`.

Очередь P0: параметры датасета, date controls, MSSQL run — см. `REMAINING_IDEAL.md` §7.

## Модули corp-селекторов (разделение)

```
corp-dash-profile     — чистая логика (profileSelectorCascade.ts, gates, reducer)
corp-selector-cascade — UI-обвязка (GroupControl, Control, ControlItemSelect, Items.js)
```

Логику каскада **не** размазывать по `client-date-controls` / полным копиям upstream.

## Команды цикла

```bash
# Проверка структуры (без полной сборки)
bash integration/verify-overlay-health.sh

# Сборка corp
YDL_UI_CLIENT_BUILD=1 bash integration/build.sh

# Bump upstream
bash integration/bump-upstream-ui.sh main
bash integration/verify-overlay-health.sh
```

## Антипаттерны

| Не делать | Почему |
|-----------|--------|
| Два модуля с одним `src/.../Control.tsx` | Побеждает последний rsync — тихая потеря правок |
| `mergedRequestParams` watch для reload селектора | Reload на каждый клик multiselect |
| Python «fix all dashboards» на проде без ревью | Ломает US; overlay при деплое **не** запускает их |
| `legacy-bulk` rsync | Отключён (`YDL_APPLY_LEGACY_BULK`) |
| Патчи без gate для org-workbooks-only | Ломают vanilla dashboards |

## Связанные документы

- `CORPORATE_PATCHES.md` — классификация модулей
- `OVERLAY_COMPATIBILITY.md` — vanilla safety
- `OVERLAY-ETALON.md` — эталон prod (US, аудит)
- `corp-selector-cascade/README.md` — минимальный каскад селекторов
- `docs/dev/platform-update-playbook.md` — bump и PR queue
