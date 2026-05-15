# Сохранность данных BI-платформы

## Где хранятся данные

Все данные платформы (воркбуки, дашборды, датасеты, подключения, пользователи и т.д.) хранятся в **PostgreSQL** в Docker-томе:

- Имя тома: `datalens-volume-${APP_ENV}` (при `APP_ENV=prod` — `datalens-volume-prod`).
- Контейнер: `datalens-postgres-prod` (или `-dev`, если `APP_ENV=dev`).

Пока этот том не удаляют, данные **сохраняются** при перезапуске контейнеров (`restart`, `up -d`, `down` **без** `-v`).

## Когда данные могут пропасть

- **`docker compose down -v`** — флаг `-v` удаляет тома, в том числе том с PostgreSQL. **В production не используйте `-v`**, если нужно сохранить данные.
- Пересоздание тома (например, после удаления тома вручную) — БД инициализируется заново, старые данные теряются.
- При переходе с `APP_ENV=dev` на `APP_ENV=prod` создаётся **новый** том `datalens-volume-prod`; данные из `datalens-volume-dev` в него не копируются автоматически.

## Восстановление данных из тома dev в prod

Если у вас остался том **datalens-volume-dev** со старыми данными и вы хотите, чтобы **prod** работал с этими же данными:

1. Остановите стек **без** удаления томов:
   ```bash
   docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml --env-file .env down
   ```
2. Скопируйте содержимое тома dev в том prod (данные в prod будут заменены):
   ```bash
   docker run --rm -v datalens-volume-dev:/from -v datalens-volume-prod:/to alpine sh -c "rm -rf /to/* /to/..?* 2>/dev/null; cp -a /from/. /to/"
   ```
3. Запустите стек снова:
   ```bash
   docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml --env-file .env up -d
   ```
   После этого контейнеры с суффиксом **-prod** будут использовать данные из бывшего dev-тома.

## Рекомендации

1. **Остановка без потери данных:**
   ```bash
   docker compose -f docker-compose.yaml -f docker-compose.own-images.yaml down
   ```
   (без `-v`).

2. **Резервная копия тома** (перед обновлением или рискованными действиями):
   ```powershell
   docker run --rm -v datalens-volume-prod:/data -v ${PWD}:/backup alpine tar czf /backup/datalens-backup-$(Get-Date -Format 'yyyyMMdd-HHmm').tar.gz -C /data .
   ```
   Восстановление из бэкапа — через восстановление тома из архива или импорт дампов PostgreSQL.

3. **Production:** по возможности используйте внешний PostgreSQL (переменные `POSTGRES_HOST`, `POSTGRES_PORT` и т.д.) и регулярные бэкапы БД средствами вашей инфраструктуры.
