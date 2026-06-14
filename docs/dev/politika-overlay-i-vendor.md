# Политика: overlay поверх official, без отставания от vendor

## Правило «спереди — да, сзади — нет»

| Допустимо | Недопустимо |
|-----------|-------------|
| Тонкий слой **поверх** `ghcr.io/datalens-tech/*` @ `versions-config.json` | Пин образов/кода **старше** official без плана отката |
| Патчи в `integration/publish-ui-overlay-dist.sh` (whitelist) | Полная пересборка UI без привязки к тегу vendor |
| `vendor/datalens` submodule **behind=0** к `datalens-tech/datalens` | Долгое отставание vendor на N релизов |
| Впереди upstream **только** через PR, после staging | «Вечный» fork akrasnov87 как второй продукт |

## Проверка отставания

```bash
bash integration/check-version-alignment.sh
# vendor/datalens vs datalens-tech/main: behind=0
```

В CI: `YDL_ENFORCE_VENDOR_SYNC=1` — fail, если `behind > 0`.

## Целевая сборка UI

```text
ghcr.io/datalens-tech/datalens-ui:<uiVersion>   # official, не трогаем Dockerfile
        + publish-ui-overlay-dist (whitelist)
        = ydl/datalens-ui:<uiVersion>-official-<sha>
```

Исходники `overlay/components/datalens-ui` — **склад патчей** до merge в upstream, не целевая модель.

## Профиль инсталляции (без правки ядра)

```bash
YDL_PROFILE=default|org-private
bash integration/apply-ydl-profile.sh
```

См. `overlay/platform/profiles/`.
