# Синхронизация с официальным `datalens-tech/datalens`

## Структура

- **`vendor/datalens/`** — submodule datalens-tech/datalens (read-only)
- **`overlay/`** — кастом
- **`git merge upstream/main` в корне YDLOS нельзя** — разные деревья

## Версии (vendor = источник правды)

См. `vendor/datalens/versions-config.json`. Overlay US пока на package `0.413.0` — цель rebase: `usVersion` (1.39.0).

```bash
bash integration/update-vendor.sh v2.9.0
bash integration/sync-official-image-pins.sh
bash overlay/platform/scripts/ydl-os/sync-platform-upstream.sh
bash integration/build.sh
```

Прод: **ghcr.io** (infra) + **overlay build** (`…-ydl-<sha>`), не `akrasnov87-images`.

## Скрипты

```bash
cd /path/to/YDLOS
bash overlay/platform/scripts/ydl-os/sync-platform-upstream.sh
BUILD_CUSTOM=1 bash integration/build.sh
bash integration/upstream-prepare-pr.sh
bash integration/rebase-us-from-upstream.sh
```

Отчёты: `overlay/platform/reports/upstream-sync-*.md`
