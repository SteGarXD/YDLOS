# Модель веток YDLOS (как устроено на самом деле)

## Это НЕ «main = чистый Yandex, feature = только кастом»

Репозиторий **SteGarXD/YDLOS** — один монорепозиторий **vendor + overlay**:

| Часть | Путь | Содержимое |
|-------|------|------------|
| Официальный DataLens | `vendor/datalens` | git submodule → [datalens-tech/datalens](https://github.com/datalens-tech/datalens), сейчас **upstream/main** (`1eb8c9b`, post-v2.9.0), **не редактировать** |
| Ваш кастом | `overlay/` | UI, auth, US, backend, compose, profiles, скрипты |
| Сборка/деплой | `integration/` | build, release, verify vendor |

**Ветка `main`** уже содержит **и vendor, и весь overlay** (все тематические коммиты).  
**Ветка `feature/future-platform-layer`** — исторический рабочий дубликат; **синхронизирована с `main`** (тот же HEAD). Отдельно мержить «официальное + кастом» не нужно — это уже в `main`.

## Как обновлять официальную часть

```bash
bash integration/update-vendor.sh v2.9.0   # или новый тег при выходе релиза
# либо для post-release коммитов upstream/main:
bash integration/update-vendor.sh main
```

Кастом остаётся в `overlay/` и не смешивается с файлами в `vendor/datalens`.

## Актуальность образов

Образы `akrasnov87/*:0.3498.0` без суффикса **не гарантируют**, что внутри последний код из `overlay/`.  
Для 100% соответствия кода и runtime:

```bash
bash integration/build.sh          # теги …-ydl-<git-sha>
bash integration/deploy-clean-prod.sh
```

См. `overlay/platform/compose/docker-compose.ydl-built-images.yaml`.
