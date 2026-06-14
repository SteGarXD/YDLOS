# overlay/patches

## datalens-ui

Модульный overlay на официальный `datalens-ui` — **без bulk-деревьев**.

| Модуль | Файлов (ориентир) |
|--------|-------------------|
| L0 server | `ydl-config`, `layout-branding`, `charts-*`, `ydl-routes`, `us-corporate`, `ydl-types` |
| L1 | `client-branding` |
| L2 | `client-features` |
| L3 | `ydl-only` (flight-groups only) |

Инвентарь: `bash integration/audit-overlay-sections.sh`  
Стратегия: `docs/dev/overlay-etalon-bulk.md`

**overlay-client / overlay-server / overlay-shared — 0 файлов, удалены.**
