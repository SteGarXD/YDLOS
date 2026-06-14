# Метрики Prometheus (self-hosted)

**Для кого:** DevOps.

YDLOS включает `METRICS_ENABLED=1` через `compose/docker-compose.ydl-metrics.yaml`.

## Endpoints (при поддержке сервисом)

| Сервис | URL (внутри docker network) |
|--------|----------------------------|
| UI | `http://ui:8080/metrics` |
| US | `http://us:8080/metrics` |
| control-api | `http://control-api:8080/metrics` |
| data-api | `http://data-api:8080/metrics` |

На хосте — через `docker exec` или sidecar Prometheus; не публикуйте `/metrics` в интернет без auth.

## Отключить

```bash
YDL_METRICS=0
```

в `.env` или при deploy.
