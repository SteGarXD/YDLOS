# RUNBOOK_DEV

Минимальный регламент для разработки и проверки изменений до production.

## 1. Dev UI на сервере (без пересборки Docker-образа)

Бэкенд в Docker, UI на хосте с hot reload (`npm run dev`). Версия на экране входа = `RELEASE_VERSION` из upstream (`2.9.0`).

```bash
bash datalens/scripts/ydl-os/dev-ui-start.sh
# Браузер: http://<IP-сервера>/  (порт 80)
tail -f datalens/reports/dev-ui/dev-ui.log

bash datalens/scripts/ydl-os/dev-ui-stop.sh   # вернуть prod UI в контейнере
```

## 2. Локальная проверка

1. Изменить код/скрипты.
2. Проверить линтеры и базовые smoke-checks.
3. Обновить документацию вместе с кодом.

## 2. Проверка дивергенции

```bash
bash scripts/ydl-os/commit-divergence-report.sh
```

## 3. Проверка кастомизаций при sync

```bash
bash scripts/ydl-os/sync-platform-upstream.sh
```

## 4. Требования к коммитам

- только факты и цель изменения;
- короткий заголовок;
- без упоминаний вспомогательных инструментов в тексте коммита.
