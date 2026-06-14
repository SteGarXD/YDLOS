# Политика: PR и обновления (обязательно)

## Перед любым PR в datalens-tech

1. Фича работает на **staging** как задумано (не только локально).
2. `bash integration/platform-acceptance.sh`
3. Чеклист по фиче из [OSS_EXTENDED_FEATURES_SMOKE.md](../../overlay/platform/docs/OSS_EXTENDED_FEATURES_SMOKE.md)
4. При изменении UI: `bash integration/publish-ui-overlay-dist.sh` + smoke на образе
5. `bash integration/check-version-alignment.sh` — **vendor behind=0**
6. Design note: `overlay/platform/design-notes/<feature>.md` (уровень L0–L8)
7. Только потом: `bash integration/upstream-prepare-pr.sh` → PR

**Запрещено:** PR из overlay, который не прошёл staging и acceptance.

## Обновление platform (vendor bump)

```bash
bash integration/update-vendor.sh main          # или тег release
bash integration/sync-official-image-pins.sh
bash integration/rebase-ui-from-upstream.sh   # отчёт diff
# патчи: port-ydl-ui-patches.sh + build + publish
bash integration/platform-acceptance.sh
# staging → prod
```

## Слои изменений (от безболезненного к болезненному)

1. `.env` / `profiles/*/features.env`
2. service-settings / объекты BI
3. `publish-ui-overlay-dist.sh` (whitelist)
4. правки `overlay/components/datalens-ui` (временно)
5. fork образа без official base (не использовать)

См. [politika-overlay-i-vendor.md](politika-overlay-i-vendor.md).
