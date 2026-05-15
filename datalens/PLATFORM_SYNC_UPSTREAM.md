# Синхронизация с официальным `datalens-tech/datalens`

## Важно про структуру репозитория

Корень репозитория **ydl-os** — это не клон `github.com/datalens-tech/datalens` один в один: каталог **`datalens/`** повторяет роль официального репо, рядом лежат **`components/`** (кастомные сборки UI/auth/US и т.д.).

Удалённый **`upstream`** указывает на официальный репозиторий. Команду **`git merge upstream/main` в корне ydl-os выполнять нельзя** — деревья не совпадают (merge-base отсутствует). Обновление платформы делается **выборочно**: образы, `docker-compose.yaml`, скрипты, документация — по смыслу и с тестами.

## Текущие версии образов (ориентир)

| Компонент | У вас в `versions-config.json` / compose | `upstream/main` (официально) |
|-----------|-------------------------------------------|------------------------------|
| auth | 0.2.6 | 0.27.0 |
| backend (control-api, data-api) | 0.2396.0 | 0.2457.0 |
| meta-manager | 0.50.0 | 0.52.0 |
| release | 2.7.0 | 2.9.0 |
| ui | 0.3498.0 | 0.3831.0 |
| us | 0.413.0 | 1.39.0 |

Официальный compose использует **`ghcr.io/datalens-tech/...`**. У вас в compose — образы **`akrasnov87/...`** с вашими доработками. Чтобы остаться на кастомном UI и при этом «как upstream»:

1. Сравнить **`git show upstream/main:docker-compose.yaml`** с вашим **`datalens/docker-compose.yaml`** (сервисы, переменные, ключи Temporal при необходимости).
2. Поднять версии в **`versions-config.json`** и теги образов **после** пересборки кастомных образов из **`components/`** (скрипты вроде `build-all-images.ps1` / CI) и публикации в реестр.
3. Либо поэтапно перевести **без кастома** сервисы на `ghcr.io`, оставив кастом только на **ui** (и при необходимости auth), снова сверив env с официальным compose.

Любое изменение в **`components/datalens-ui`** вступает в силу на сервере **только после пересборки и выката образа** `datalens-ui` с новым тегом (см. **`CUSTOMIZATION_MANIFEST.md`**).

## Безопасный порядок перед обновлением на проде

1. Резервная копия тома PostgreSQL (метаданные US, дашборды и т.д.).
2. Поднять копию стека на тестовом хосте / compose-проект с другим именем тома.
3. `docker compose pull` (если перешли на ghcr) или загрузка своих новых тегов.
4. `docker compose up -d` и смоук: вход, воркбук, MSSQL-коннектор, OIDC.
5. Только затем прод.

## Команды для сравнения с upstream (локально)

```bash
git fetch upstream
git show upstream/main:versions-config.json
git show upstream/main:docker-compose.yaml | less
```

Дальше — ручной или полуавтоматический перенос изменений в **`datalens/docker-compose.yaml`** и ваши **`components/`**, затем коммит в **`development`**.

## Автоматический цикл (отчёт + опции)

Скрипт **`datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh`**:

1. Выполняет `git fetch upstream` и `git fetch origin`.
2. Проверяет наличие общего предка с `upstream/main` (если нет — фиксирует в отчёте, merge не предлагается).
3. Пишет отчёт в **`datalens/datalens/reports/upstream-sync-*.md`** (ветка, HEAD, shortlog upstream, список файлов с **`YDL-OS`**).
4. Опционально: `BUILD_CUSTOM=1` — сборка образов UI и auth; `SMOKE=1` — проверка `/ping` и `refreshTokens` на `http://127.0.0.1`.

Примеры:

```bash
cd /path/to/ydl-os   # корень монорепо (где .git и components/)
bash datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh
BUILD_CUSTOM=1 SMOKE=1 bash datalens/datalens/scripts/ydl-os/sync-platform-upstream.sh
```

Полный перенос логики из upstream по-прежнему **инженерное решение** по diff; скрипт убирает рутину fetch/фиксации/чеклиста.

## Push на `git.aeronavigator.ru`

Идентификация коммитов (локально в клоне):

```bash
git config user.name "SteGar"
git config user.email "g.stepanov@aeronavigator.ru"
```

Если `git push origin development` пишет **`could not read Username for 'https://…'`** — для HTTPS нужен credential helper или **переключите remote на SSH**:

```bash
git remote -v
git remote set-url origin git@git.aeronavigator.ru:Aeronavigator/ydl-os.git
ssh -T git@git.aeronavigator.ru
git push origin development
```

Точный URL SSH возьмите из веб-интерфейса GitLab (Clone → SSH).

### Если SSH: `Connection refused` на порту 22

На корпоративном GitLab часто **закрыт 22**, открыт только **HTTPS (443)**. Проверка: `nc -zv git.aeronavigator.ru 22` → refused, `nc -zv git.aeronavigator.ru 443` → ok.

Тогда **не переключайтесь на SSH** — оставьте **HTTPS** и пушьте с **PAT** (или паролем, если разрешено политикой):

```bash
git remote set-url origin https://git.aeronavigator.ru/Aeronavigator/ydl-os.git
git config credential.helper store   # один раз; дальше сохранит в ~/.git-credentials
git push origin development          # логин GitLab + PAT как пароль
```

Создание PAT: в GitLab → **User Settings → Access Tokens** (scope как минимум `write_repository`).

Чтобы снова включить SSH, это настройка **сервера Git / firewall** (админ GitLab), не `sudo` на клиенте.
