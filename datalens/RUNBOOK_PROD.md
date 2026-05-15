# RUNBOOK_PROD

Краткий production-регламент для YDL OS.

## 1. Перед деплоем

1. Проверить актуальность `github/main` относительно `upstream/main`.
2. Снять backup метаданных (`pg_dump`) и убедиться, что есть предыдущий backup.
3. Убедиться, что `.env` содержит рабочие production-секреты.

## 2. Деплой

Автопилотный цикл:

```bash
bash scripts/ydl-os/autopilot-sync-build-smoke-deploy.sh
```

Ручной деплой из `github/main`:

```bash
bash scripts/ydl-os/redeploy-from-github-main.sh
```

## 3. Smoke-check после деплоя

Ожидаемые коды:

- `GET http://127.0.0.1/ping` -> `200`
- `POST http://127.0.0.1/gateway/auth/auth/refreshTokens` (без cookie) -> `401`

## 4. Проверка источника деплоя

```bash
sed -n '1,20p' /opt/ydl-os/.ydl-deploy-source
```

Должно быть:

- `source=github/main`
- корректный `commit=<sha>`

## 5. Ночной регламент

Установка cron:

```bash
bash scripts/ydl-os/install-nightly-cron.sh
```

Проверка:

```bash
crontab -l
```
