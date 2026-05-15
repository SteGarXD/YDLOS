# Обновление с официального DataLens и безопасность (YDL OS / форк akrasnov87)

Официальный репозиторий: [datalens-tech/datalens](https://github.com/datalens-tech/datalens.git).  
Форк с ролями/проектами и `datalens-auth`: [akrasnov87/datalens](https://github.com/akrasnov87/datalens.git).

---

## 1. Как у вас обычно запускается платформа (demo + compose)

Типовые варианты из корня репозитория `datalens/`:

- Только demo-оверлей:
  ```bash
  docker compose -f docker-compose.demo.yaml --env-file=./.env up
  ```
- Demo + базовый compose + локальный dev (как в README):
  ```bash
  docker compose -f docker-compose.yaml -f docker-compose.demo.yaml -f docker-compose.local-dev.yaml --env-file .env up -d
  ```

Переменные и демо-данные — в `.env` (не коммитить секреты в git). Сохранность тома PostgreSQL при обновлениях: [DATA-PERSISTENCE.md](DATA-PERSISTENCE.md).

---

## 2. «Auth отключён» в форке akrasnov87 — что это значит на самом деле

Это **не** то же самое, что «нет безопасности вообще».

- В `docker-compose.yaml` у сервиса **us** по умолчанию `AUTH_ENABLED: ${AUTH_ENABLED:-false}` — отключается **встроенный в US** сценарий, совместимый с «классической» облачной авторизацией Yandex DataLens.
- Сервис **us-auth** (`datalens-auth`) в форке **остаётся нужен**: через `NODE_RPC_URL` (например `http://us-auth/demo/rpc`) United Storage получает **роли, проекты, права**, данные в схеме `core` и т.д. Это «плюшки» форка относительно чистого open-source Yandex без этой модели.
- В **ui** политика вида `AUTH_POLICY: disabled` означает, что **веб-интерфейс** не ведёт пользователя через OIDC/SSO как в облаке; вход/сессии завязаны на модель форка (демо, RPC, учётки в БД).

**Вывод:** логика akrasnov87 сохраняется, если **us-auth запущен** и `NODE_RPC_URL` / `AUTH_ENDPOINT` согласованы с compose (см. README, раздел про `NODE_RPC_URL` и порты).

### Насколько «плохо», что нет «облачного» auth?

- **Внутри закрытой сети** (VPN, только офисные IP, нет выхода в интернет): часто приемлемо при жёстком периметре и мониторинге.
- **С доступом из интернета без дополнительной защиты**: это **критично** — любой, кто достучался до URL, потенциально получает доступ к BI на уровне ваших демо/учёток. Это не «баг форка», а **модель угрозы**: приложение не заменяет сетевой периметр.

Имеет смысл держать **два режима**: внутренний стенд с текущей моделью и внешний — с reverse-proxy, ограничением IP, по возможности отдельным SSO или хотя бы сильной изоляцией.

---

## 3. Безопасность платформы (практичный минимум)

Ниже — слои защиты, которые **реально** снижают риск DDoS/сканирования/утечек, даже когда «облачный» auth в UI выключен.

### 3.1 Сеть и доступ

- Не публиковать **PostgreSQL** и внутренние порты сервисов наружу; наружу — только **443** (и при необходимости 80 → редирект на HTTPS).
- Файрвол: по умолчанию `deny`, разрешить только нужные IP/VPN или подсеть балансировщика.
- По возможности: **VPN** или **private link** до хоста с Docker.

### 3.2 Пограничный reverse-proxy (Nginx / балансировщик)

- TLS (Let's Encrypt или корпоративные сертификаты), современные шифры, HSTS при стабильном HTTPS.
- **Ограничение частоты запросов** (`limit_req`), лимит размера тела запроса, таймауты к upstream.
- Заголовки безопасности (CSP, X-Frame-Options / frame-ancestors, и т.д.) — у вас часть уже в nginx-конфиге для production-оверлея; при обновлении upstream сверяйте изменения в официальных примерах nginx.

### 3.3 Docker и хост

- Обновления ОС и Docker, отдельный пользователь без лишних sudo.
- Логи контейнеров с ротацией (у вас уже задаётся в production override).
- Секреты только в `.env` или secret manager, **не** в git (см. `deploy.sh`: rsync не должен затирать продовый `.env` с машины разработчика).

### 3.4 Данные и бэкапы

- Регулярные дампы US / полный снимок тома: [DATA-PERSISTENCE.md](DATA-PERSISTENCE.md), [DOCKER-BACKUP.md](../DOCKER-BACKUP.md).
- Перед любым обновлением: **снимок тома** или `pg_dump` + проверка, что архив не нулевой.

### 3.5 Учётные записи по умолчанию

Пароли демо-пользователей из документации форка (например `qwe-123`) — **только для закрытого стенда**. Для любой среды с доступом извне: сменить пароли, ограничить список пользователей, не использовать демо-роли для боевых данных.

---

## 4. Безопасное обновление с официального `datalens-tech` с сохранением кастомного UI и данных

Цель: подтянуть исправления и версии из [datalens-tech/datalens](https://github.com/datalens-tech/datalens.git), **не потеряв**:

- образ/код **своего** `datalens-ui` (брендинг, кнопки, дашборды в коде, MSSQL-особенности и т.д.);
- **метаданные** (воркбуки, дашборды, подключения, настройки) — они в **PostgreSQL** в Docker-томе;
- свои правки в `components/datalens-ui`, `components/datalens-us`, backend и т.д.

### Шаг 0. Зафиксировать remotes

В корне монорепозитория (где лежит `docker-compose.yaml`):

- `origin` — ваш `ydl-os` на Gitea.
- `upstream` — `https://github.com/datalens-tech/datalens.git`.
- при необходимости `vendor` — `https://github.com/akrasnov87/datalens.git` (чтобы сравнивать поведение форка).

### Шаг 1. Бэкап (обязателен)

1. Остановить стек **без** `-v` (тома не трогать).
2. Сделать дамп / архив тома (см. [DATA-PERSISTENCE.md](DATA-PERSISTENCE.md), [DOCKER-BACKUP.md](../DOCKER-BACKUP.md)).
3. Зафиксировать текущие теги образов: `docker compose config` или снимок `docker images`.

### Шаг 2. Подтянуть upstream в git

На ветке интеграции (например `development`):

```bash
git fetch upstream
git merge upstream/main
```

(или `main`/`master` — как называется дефолтная ветка у upstream на момент обновления). Разрешить конфликты, **сохраняя** ваши изменения в `components/`, `nginx/`, своих `docker-compose*.yaml`, скриптах.

### Шаг 3. Версии сервисов

Сравнить ваш `versions-config.json` с [versions-config.json upstream](https://github.com/datalens-tech/datalens/blob/main/versions-config.json):

- обновить **теги образов** backend/us/meta-manager/auth и т.д. в compose / `docker-compose.own-images.yaml`, **если** вы не собираете эти сервисы сами;
- для **ui** и **ui-api**: оставить **ваш** образ (см. ниже), но **базовую версию** (номер пакета) лучше синхронизировать с upstream, чтобы не разъехались API gateway и UI.

### Шаг 4. Кастомный UI: обновить код и пересобрать образ

Рабочая копия: `components/datalens-ui` (см. [PATCHES-AND-UI-FROM-IMAGE.md](PATCHES-AND-UI-FROM-IMAGE.md)).

1. В репозитории UI добавить remote на официальный `datalens-tech/datalens-ui`, забрать изменения (merge или rebase — по политике команды).
2. Собрать образ (ваш registry/имя тега, например `aeronavigatorbi/datalens-ui:<версия>`), как в `build-all-images.ps1` / `Dockerfile` в UI.
3. В корневом `docker-compose.yaml` (или `docker-compose.own-images.yaml`) для сервисов **ui** и **ui-api** указать **ваш** image-тег.
4. Прогнать smoke-тесты: логин/демо, ключевые дашборды, экспорт, MSSQL, брендинг.

### Шаг 5. Запуск после обновления

- Для привычного режима:  
  `docker compose -f docker-compose.yaml -f docker-compose.demo.yaml ... --env-file .env up -d`  
  (или только `docker-compose.demo.yaml`, как у вас заведено).
- Проверить миграции US (переменная `SKIP_MIGRATION` в `.env` — только осознанно).

### Шаг 6. Что сохранится «само»

- **Дашборды, подключения, настройки в US** — в томе PostgreSQL, пока не выполняли `docker compose down -v` и не пересоздавали том.
- **Кастом в коде** — в git; после merge upstream и ваших тестов — в образах, которые вы публикуете.

Если после обновления upstream что-то «сломалось» в UI — откат: **предыдущий тег образа** UI + восстановление БД из бэкапа шага 1.

---

## 5. Краткий чеклист после обновления

- [ ] Стек поднялся, `docker ps` без `Restarting`.
- [ ] UI открывается, брендинг на месте.
- [ ] Ключевые дашборды и подключения (в т.ч. MSSQL) работают.
- [ ] `us-auth` доступен из сети compose, `NODE_RPC_URL` не «битый».
- [ ] Бэкап шага 1 сохранён отдельно от рабочей машины (S3/NAS и т.д.).

---

## 6. Связанные документы

- [PRODUCTION_SENIOR_PLAYBOOK.md](PRODUCTION_SENIOR_PLAYBOOK.md) — продакшен, ИБ, инвентаризация сервера, что не удалять без согласования.
- [DATA-PERSISTENCE.md](DATA-PERSISTENCE.md) — где живут данные и как не потерять том.
- [PATCHES-AND-UI-FROM-IMAGE.md](PATCHES-AND-UI-FROM-IMAGE.md) — стратегия UI и образов.
- [DEPLOY-YDL-OS.md](DEPLOY-YDL-OS.md) — деплой с собственными образами.
- [DEV_AUTH_STACK.md](DEV_AUTH_STACK.md) — нюансы auth в dev.
