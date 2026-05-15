# Сброс метаданных US (чистая БД коллекций / воркбуков / дашбордов)

Содержимое БД **`pg-us-db`** (Universal Storage) — это все объекты в интерфейсе: коллекции, воркбуки, датасеты, дашборды, подключения в метаданных и т.д.  
Сброс **не** трогает `pg-compeng-db` (движок запросов), **не** останавливает Temporal и **по умолчанию** не трогает `pg-auth-db` (пользователи RPC/us-auth — см. ниже).

## Перед началом

1. **Резервная копия** (если что-то нужно сохранить):
   ```bash
   docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" <postgres-container> \
     pg_dump -U pg-user -d pg-us-db -Fc -f /tmp/us.dump
   docker cp <postgres-container>:/tmp/us.dump ./us-backup.dump
   ```
2. Узнайте **имя контейнера Postgres**: `docker ps` (часто `datalens-postgres-prod` или с вашим `APP_ENV`).
3. Значения из `.env` / `docker-compose`: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB_US` (по умолчанию `pg-us-db`).

## Шаг 1 — остановить US

Чтобы не было висящих подключений к `pg-us-db`:

```bash
cd datalens   # каталог с docker-compose.yaml
docker compose stop us
# при необходимости: docker compose stop meta-manager
```

## Шаг 2 — пересоздать БД `pg-us-db`

Из корня репозитория YDLOS (или скопируйте скрипт):

**Linux / Git Bash / WSL:**

```bash
export POSTGRES_CONTAINER=datalens-postgres-prod   # замените на своё имя
export POSTGRES_USER=pg-user
export POSTGRES_PASSWORD=postgres
export POSTGRES_DB_US=pg-us-db
bash datalens/postgres/reset-us-metadata.sh
```

**PowerShell (без bash):** выполните SQL вручную через `docker exec`:

```powershell
$pg = "datalens-postgres-prod"  # имя контейнера
$env:PGPASSWORD = "postgres"
docker exec -e PGPASSWORD=postgres $pg psql -U pg-user -d postgres -v ON_ERROR_STOP=1 -c @"
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'pg-us-db' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS ""pg-us-db"";
CREATE DATABASE ""pg-us-db"" WITH OWNER ""pg-user"" ENCODING 'UTF8' LC_COLLATE = 'en_US.utf8' LC_CTYPE = 'en_US.utf8';
"@
```

В PostgreSQL в `-c` кавычки для идентификаторов с дефисом — удобнее передать файл или использовать `docker exec -i ... psql ... < reset.sql`.

Проще одной командой с файлом: создайте `reset-us.sql` с тем же содержимым, что в heredoc внутри `reset-us-metadata.sh`, затем:

```powershell
Get-Content .\reset-us.sql -Raw | docker exec -i -e PGPASSWORD=postgres datalens-postgres-prod psql -U pg-user -d postgres -v ON_ERROR_STOP=1
```

После `CREATE DATABASE` снова подключитесь к `pg-us-db` и выполните блок `CREATE EXTENSION` из скрипта `reset-us-metadata.sh`.

## Шаг 3 — запустить US (миграции)

```bash
docker compose up -d us
docker compose logs -f us   # убедиться, что нет ошибок миграций; SKIP_MIGRATION должен быть 0
```

## Шаг 4 — клиент

- Удалите в браузере **`localStorage`** ключ **`x-rpc-authorization`** (или выйдите из сессии и зайдите снова).
- Создайте заново коллекции, пользователей (если нужны), воркбуки и объекты.

---

## Опционально: сброс пользователей RPC (`pg-auth-db`)

Если включён **us-auth** и вы хотите **удалить всех пользователей** и завести их заново:

1. Остановите: `docker compose stop us-auth us`.
2. Аналогично пересоздайте БД **`pg-auth-db`** (те же шаги, что для `pg-us-db`, с другим именем БД).
3. На **первом** старте us-auth обычно снова накатываются миграции; при необходимости смотрите документацию образа `datalens-us-auth` / логи контейнера.

Без полного понимания схемы auth **достаточно** часто хватает только сброса **`pg-us-db`**.

---

## «Ядерный» вариант — все БД в одном томе

`docker compose down -v` удалит **volume** Postgres и **все** базы (compeng, us, auth, temporal…). Используйте только если осознанно поднимаете стенд с нуля.

---

См. также: [US_BACKUP_ANALYSIS.md](./US_BACKUP_ANALYSIS.md).
