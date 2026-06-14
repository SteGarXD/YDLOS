# Установка

**Для кого:** DevOps.

## Требования

- Docker, Docker Compose v2
- PostgreSQL volume для метаданных
- Доступ к источникам данных из сети контейнеров

Официально: https://datalens.ru/opensource/docs/ru/concepts/create-instance.html

## YDLOS (self-hosted)

```bash
git clone --recurse-submodules <your-repo-url> && cd YDLOS
cp overlay/platform/.env.example overlay/platform/.env   # заполнить секреты
bash integration/check-version-alignment.sh
bash integration/publish-ui-overlay-dist.sh
bash integration/compose.sh up -d
```

Детали: [overlay/platform/docs/OPERATING_MODEL.md](../../overlay/platform/docs/OPERATING_MODEL.md).
