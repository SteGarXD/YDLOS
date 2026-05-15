# Инструкция по развертыванию Yandex DataLens на Ubuntu Linux

## Обзор

Данная инструкция описывает процесс развертывания форка Yandex DataLens от [akrasnov87/datalens](https://github.com/akrasnov87/datalens) на сервере Ubuntu Linux.

## Требования к системе

### Минимальные требования

- **ОС**: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS
- **RAM**: 4 GB (рекомендуется 8 GB)
- **CPU**: 2 ядра (рекомендуется 4+)
- **Диск**: 20 GB свободного места (рекомендуется 50+ GB)
- **Docker**: версия 20.10 или выше
- **Docker Compose**: версия 1.29.0 или выше (или плагин v2)

### Распределение ресурсов по компонентам

- `datalens-auth`: 256 MB RAM
- `datalens-ui`: 512 MB RAM
- `datalens-data-api`: 1 GB RAM
- `datalens-control-api`: 512 MB RAM
- `datalens-us`: 512 MB RAM
- `datalens-postgres`: 512 MB RAM
- `datalens-temporal`: 512 MB RAM (опционально)
- `datalens-meta-manager`: 256 MB RAM (опционально)

## Подготовка системы

### 1. Обновление системы

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Установка Docker

#### Для Ubuntu 20.04/22.04/24.04

```bash
# Удаление старых версий Docker (если есть)
sudo apt remove docker docker-engine docker.io containerd runc -y

# Установка зависимостей
sudo apt install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление официального GPG ключа Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Настройка репозитория
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавление текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Применение изменений группы (требуется перелогиниться)
newgrp docker

# Проверка установки
docker --version
docker compose version
```

**Примечание**: После добавления пользователя в группу docker необходимо выйти и войти в систему заново, либо выполнить `newgrp docker`.

### 3. Настройка Docker (опционально)

Для production рекомендуется настроить логирование и ограничения:

```bash
# Создание директории для конфигурации
sudo mkdir -p /etc/docker

# Настройка daemon.json
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Перезапуск Docker
sudo systemctl restart docker
```

## Развертывание DataLens

### 1. Клонирование репозитория

```bash
# Переход в рабочую директорию
cd /opt

# Клонирование репозитория
sudo git clone https://git.aeronavigator.ru/SteGar/ydl-os.git datalens
cd datalens

# Переключение на ветку master
git checkout master
```

### 2. Настройка переменных окружения

#### Создание файла .env

```bash
# Создание файла .env из примера (если есть)
# Или создание нового файла
nano .env
```

#### Минимальная конфигурация .env для production

```bash
# Базовые настройки
APP_ENV=prod
RELEASE_VERSION=2.7.0-night

# PostgreSQL
POSTGRES_USER=pg-user
POSTGRES_PASSWORD=<сгенерируйте_надежный_пароль>
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Базы данных
POSTGRES_DB_COMPENG=pg-compeng-db
POSTGRES_DB_AUTH=pg-auth-db
POSTGRES_DB_US=pg-us-db
POSTGRES_DB_DEMO=pg-demo-db
POSTGRES_DB_META_MANAGER=pg-meta-manager-db
POSTGRES_DB_TEMPORAL=pg-temporal-db
POSTGRES_DB_TEMPORAL_VISIBILITY=pg-temporal-visibility-db

# UnitedStorage
US_MASTER_TOKEN=<сгенерируйте_надежный_токен>
US_ENDPOINT=http://us:8080

# Control API
CONTROL_API_CRYPTO_KEY=<сгенерируйте_base64_ключ_32_байта>

# Авторизация (если используется datalens-auth)
INIT_DB_AUTH=1
NODE_RPC_URL=http://us-auth/demo/rpc
AUTH_ENV=demo

# Highcharts (опционально, требует лицензию)
HC=0
HC_ENDPOINT=localhost:8080/highcharts
HC_PROTOCOL=http

# Yandex Maps (опционально)
YANDEX_MAP_ENABLED=0
YANDEX_MAP_TOKEN=

# Демонстрационные данные
INIT_DEMO_DATA=1
INIT_DB_DEMO=1

# Temporal (опционально)
INIT_DB_TEMPORAL=1

# Meta Manager
INIT_DB_META_MANAGER=1

# Схемы для игнорирования
IGNORE_SCHEMA="'public','pg_catalog','information_schema'"
```

#### Генерация безопасных ключей

```bash
# Генерация пароля PostgreSQL
openssl rand -base64 32

# Генерация US_MASTER_TOKEN
openssl rand -base64 32

# Генерация CONTROL_API_CRYPTO_KEY (32 байта в base64)
python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

### 3. Использование скрипта init.sh (рекомендуется)

Скрипт `init.sh` автоматически генерирует production конфигурацию с безопасными ключами:

```bash
# Просмотр справки
./init.sh --help

# Генерация production конфигурации с Highcharts
./init.sh --hc --up

# Генерация production конфигурации без Highcharts
./init.sh --up

# Генерация с Yandex Maps
./init.sh --yandex-map --yandex-map-token YOUR_TOKEN --up

# Генерация с внешней PostgreSQL
./init.sh --postgres-external --postgres-ssl --postgres-cert ./cert.pem --up

# Генерация без авторизации (для разработки)
./init.sh --disable-auth --up

# Генерация без Temporal (для экономии ресурсов)
./init.sh --disable-temporal --up

# Генерация без экспорта workbook
./init.sh --disable-workbook-export --up
```

**Важно**: После выполнения `init.sh` проверьте файл `.env` - там будут сгенерированы безопасные ключи и пароли.

### 4. Запуск через Docker Compose

#### Быстрый старт (с авторизацией)

```bash
# Запуск с docker-compose.demo.yaml
docker compose -f docker-compose.demo.yaml --env-file=./.env up -d

# Просмотр логов
docker compose -f docker-compose.demo.yaml --env-file=./.env logs -f
```

#### Production запуск

```bash
# Если использовали init.sh, будет создан docker-compose.production.yaml
docker compose -f docker-compose.production.yaml up -d

# Или используйте базовый файл
docker compose -f docker-compose.yaml --env-file=./.env up -d
```

### 5. Проверка работоспособности

```bash
# Проверка статуса контейнеров
docker compose ps

# Проверка логов всех сервисов
docker compose logs --tail=50

# Проверка логов конкретного сервиса
docker compose logs datalens-ui
docker compose logs datalens-postgres
docker compose logs datalens-auth

# Проверка доступности UI
curl http://localhost:8080

# Проверка healthcheck PostgreSQL
docker compose exec postgres pg_isready -U pg-user
```

## Доступ к системе

### Веб-интерфейс

После успешного запуска DataLens будет доступен по адресу:

```
http://<IP_СЕРВЕРА>:8080
```

### Учетные данные по умолчанию

При использовании `docker-compose.demo.yaml` с авторизацией:

- **Пользователь master**: `master` / `qwe-123`
- **Пользователь admin**: `admin` / `qwe-123`
- **Пользователь user**: `user` / `qwe-123`

**Важно**: Измените пароли по умолчанию в production!

### Порты

- **8080**: DataLens UI (основной интерфейс)
- **5432**: PostgreSQL (если проброшен наружу)
- **7233**: Temporal (если используется)
- **8233**: Temporal UI (если используется)

## Настройка авторизации

### Использование datalens-auth

Форк поддерживает кастомную авторизацию через компонент `datalens-auth`:

1. Убедитесь, что в `.env` установлено:
   ```bash
   INIT_DB_AUTH=1
   NODE_RPC_URL=http://us-auth/demo/rpc
   ```

2. После первого запуска в БД создастся схема `core` с таблицами:
   - `pd_users` - пользователи
   - `pd_roles` - роли
   - `pd_accesses` - права доступа
   - `pd_userinroles` - связь пользователей и ролей

3. Создание пользователя через SQL:
   ```sql
   SELECT core.sf_create_user('username', 'password', 'email@example.com', '["datalens"]');
   ```

### Настройка OIDC/SSO

Для подключения внешних провайдеров авторизации добавьте в `.env`:

```bash
# Первый провайдер
OIDC=true
OIDC_ISSUER=https://accounts.google.com/.well-known/openid-configuration
OIDC_BASE_URL=https://your-domain/auth/v1/oidc
OIDC_CLIENT_ID=your-client-id
OIDC_SECRET=your-secret
OIDC_NAME="GOOGLE"

# Второй провайдер (до 4 провайдеров)
OIDC_2=true
OIDC_ISSUER_2=https://your-oidc-provider/.well-known/openid-configuration
OIDC_BASE_URL_2=https://your-domain/auth/v1/oidc
OIDC_CLIENT_ID_2=your-client-id-2
OIDC_SECRET_2=your-secret-2
OIDC_NAME_2="PROVIDER_NAME"
```

## Управление системой

### Остановка

```bash
docker compose -f docker-compose.demo.yaml --env-file=./.env down
```

### Перезапуск

```bash
docker compose -f docker-compose.demo.yaml --env-file=./.env restart
```

### Обновление

```bash
# Получение последних изменений
git pull

# Перезапуск контейнеров
docker compose -f docker-compose.demo.yaml --env-file=./.env up -d --pull always
```

### Просмотр логов

```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f datalens-ui

# Последние 100 строк
docker compose logs --tail=100
```

### Очистка данных (осторожно!)

```bash
# Остановка и удаление контейнеров
docker compose down

# Удаление volumes (удалит все данные!)
docker compose down -v

# Удаление только volumes БД
docker volume rm datalens-volume-prod
```

## Использование внешней PostgreSQL

### Настройка подключения

1. В `.env` укажите параметры внешней БД:
   ```bash
   POSTGRES_HOST=your-postgres-host
   POSTGRES_PORT=5432
   POSTGRES_USER=your-user
   POSTGRES_PASSWORD=your-password
   ```

2. Установите расширения PostgreSQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS btree_gin;
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

3. Запустите с флагом `--postgres-external`:
   ```bash
   ./init.sh --postgres-external --up
   ```

### SSL подключение

```bash
# С сертификатом
./init.sh --postgres-external --postgres-ssl --postgres-cert ./cert.pem --up

# В .env добавьте:
POSTGRES_ARGS="?sslmode=require"
```

## Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверка логов
docker compose logs

# Проверка доступности портов
sudo netstat -tulpn | grep -E '8080|5432'

# Проверка Docker
sudo systemctl status docker
```

### Проблема: Ошибка "Fernet key must be 32 url-safe base64-encoded bytes"

Проверьте `CONTROL_API_CRYPTO_KEY` в `.env` - он должен быть валидным base64 ключом длиной 32 байта.

```bash
# Генерация правильного ключа
python3 -c "import base64, os; print(base64.urlsafe_b64encode(os.urandom(32)).decode())"
```

### Проблема: Нет демонстрационных данных

1. Убедитесь, что в `.env`:
   ```bash
   INIT_DEMO_DATA=1
   INIT_DB_DEMO=1
   ```

2. Удалите volume и пересоздайте:
   ```bash
   docker compose down -v
   docker compose up -d
   ```

### Проблема: Авторизация не работает (ошибка 500)

Это нормально при первом запуске - подождите пока все сервисы полностью запустятся (может занять 2-5 минут).

Проверьте логи:
```bash
docker compose logs datalens-auth
docker compose logs datalens-us
```

### Проблема: Контейнеры постоянно перезапускаются

```bash
# Проверка логов проблемного контейнера
docker compose logs <container-name>

# Проверка ресурсов
docker stats

# Проверка места на диске
df -h
```

### Проблема: Недостаточно памяти

Отключите опциональные сервисы:

```bash
# Без Temporal
./init.sh --disable-temporal --up

# Без экспорта workbook
./init.sh --disable-workbook-export --up
```

## Мониторинг и обслуживание

### Проверка использования ресурсов

```bash
# Статистика контейнеров
docker stats

# Использование диска
docker system df

# Использование volumes
docker volume ls
```

### Резервное копирование

```bash
# Бэкап PostgreSQL volume
docker run --rm -v datalens-volume-prod:/data -v $(pwd):/backup ubuntu tar czf /backup/datalens-backup-$(date +%Y%m%d).tar.gz /data

# Восстановление
docker run --rm -v datalens-volume-prod:/data -v $(pwd):/backup ubuntu tar xzf /backup/datalens-backup-YYYYMMDD.tar.gz -C /
```

### Обновление системы

```bash
# Получение обновлений
git pull origin master

# Пересборка образов (если нужно)
docker compose build

# Перезапуск с новыми образами
docker compose up -d --pull always
```

## Безопасность

### Рекомендации для production

1. **Измените все пароли по умолчанию**
2. **Используйте сильные пароли** (минимум 32 символа)
3. **Ограничьте доступ к портам** через firewall
4. **Используйте HTTPS** через reverse proxy (nginx/traefik)
5. **Регулярно обновляйте** систему и контейнеры
6. **Настройте мониторинг** и алерты
7. **Делайте регулярные бэкапы**

### Настройка firewall

```bash
# Установка UFW
sudo apt install ufw

# Разрешение SSH
sudo ufw allow 22/tcp

# Разрешение DataLens (только для внутренней сети)
sudo ufw allow from 10.0.0.0/8 to any port 8080

# Включение firewall
sudo ufw enable
```

## Дополнительные ресурсы

- [Официальный репозиторий форка](https://github.com/akrasnov87/datalens)
- [Документация по авторизации](https://github.com/akrasnov87/datalens-auth)
- [Roadmap проекта](https://github.com/akrasnov87/datalens/blob/main/docs/roadmap.md)
- [Features](https://github.com/akrasnov87/datalens/blob/main/docs/features.md)

## Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose logs`
2. Изучите документацию в репозитории
3. Проверьте Issues на GitHub
4. Обратитесь к сообществу в Telegram: [Yandex DataLens Community](https://t.me/YandexDataLens)

---

**Версия документа**: 1.0  
**Дата обновления**: 2026-01-27
