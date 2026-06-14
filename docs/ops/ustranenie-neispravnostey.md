# Устранение неисправностей

**Для кого:** DevOps.

## Быстрая диагностика

```bash
docker ps --filter name=datalens
docker logs datalens-ui-prod --tail 100
docker logs datalens-us-prod --tail 100
```

## Индекс

- Коды ошибок: [../spravochnik-oshibok.md](../spravochnik-oshibok.md)
- Подробно: [overlay/platform/TROUBLESHOOTING.md](../../overlay/platform/TROUBLESHOOTING.md)

## После обновления

[obnovlenie-platformy.md](obnovlenie-platformy.md)
