# Обновление платформы

**Для кого:** DevOps.

## Сценарий (один проход)

```bash
cd YDLOS
git pull
git submodule update --remote vendor/datalens
bash integration/update-vendor.sh          # при смене тега релиза
bash integration/check-version-alignment.sh
bash integration/build.sh
bash integration/publish-ui-overlay-dist.sh   # если менялся overlay UI
bash integration/compose.sh pull
bash integration/compose.sh up -d
bash overlay/platform/scripts/ydl-os/smoke-basic.sh   # если есть
```

## Откат

1. Зафиксировать предыдущий тег образа UI в `.ydl-built-images.env`.
2. `docker compose up -d` с предыдущим env.
3. БД не откатывать без backup.

## После обновления

- Проверить вход и дашборд.
- Сверить `uiVersion` в [vendor/datalens/versions-config.json](../../vendor/datalens/versions-config.json) с overlay.
