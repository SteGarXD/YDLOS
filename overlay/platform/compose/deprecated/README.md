# Устаревшие compose-файлы

Не подключать на prod. Оставлены только для отката `YDL_LEGACY_AUTH=1`.

| Файл | Зачем был |
|------|-----------|
| `docker-compose.ydl-legacy-auth.yaml` | US 0.413 + us-auth |
| `docker-compose.akrasnov87-images.yaml` | образы форка 2.7 |
| `docker-compose.legacy-akrasnov.yaml` | старый стек |

Prod: `docker-compose.ydl-official-auth.yaml` + `official-images.yaml`.
