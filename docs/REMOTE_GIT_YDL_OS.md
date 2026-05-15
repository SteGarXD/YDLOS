# Синхронизация с корпоративным репозиторием

Официальный ремоут проекта: **https://git.aeronavigator.ru/Aeronavigator/ydl-os.git**

Из этой среды (Cursor/CI) к вашему GitLab без учётных данных зайти нельзя — все правки по брендингу, бэкапам, дашборду и т.д. лежат **в локальном клоне** `D:\YDLOS` (ветка `development` и др.).

## Подтянуть «наверняка» все правки с сервера

```powershell
cd D:\YDLOS
git remote add aero https://git.aeronavigator.ru/Aeronavigator/ydl-os.git
# если remote уже есть — git remote set-url aero https://...
git fetch aero
git log --oneline HEAD..aero/development   # что есть на сервере, чего нет локально
git merge aero/development
# или: git cherry-pick <hash>
```

## Сравнить только UI (тема, лого, дашборд)

```powershell
git diff aero/development -- components/datalens-ui/src/ui/styles/
git diff aero/development -- components/datalens-ui/src/ui/datalens/
git diff aero/development -- datalens/us-restore.ps1 datalens/backups/
```

## Кракозябры после восстановления US

Подробный разбор текущего бэкапа и скрипт правки имён: **`datalens/docs/US_BACKUP_ANALYSIS.md`**, SQL: **`datalens/postgres/fix-us-mojibake-from-sort-name.sql`**.

Скрипт `us-restore.ps1` задаёт `PGCLIENTENCODING=UTF8` при `psql`; если в **самом файле** INSERT уже mojibake в `name`/`description`, это не исправит — нужен `UPDATE` из `sort_name` (bytea) или правка в UI.

## Оранжевый в интерфейсе

Переопределения: `ui/styles/opensource-chartkit-theme.scss` (в т.ч. токены на `body.dl-brand-blue` для порталов), `variables.scss`, класс `dl-brand-blue` в `ui/entries/dl-main.tsx`.
