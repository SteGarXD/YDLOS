# Аудит платформы YDL OS на 2026-05-15

Документ фиксирует состояние платформы после синхронизации с `upstream/main`, проверки документации, безопасности и деплоя.

## 1) Синхронизация с официальным DataLens

- Проверено по git:
  - `upstream/main = 5ac5a92...` (2026-05-12, `DLOPS-28: add dbs for notify`).
  - `github/main (SteGarXD/YDLOS) = 85339f6...`.
  - Дивергенция: `git rev-list --left-right --count upstream/main...github/main` = **`0 1`**.
- Интерпретация:
  - **0 behind**: отставания по коммитам от текущего `upstream/main` нет.
  - **1 ahead**: поверх upstream есть один кастомный commit-snapshot с деревом вашего `development`.
- Ограничение:
  - Метрика по коммитам не равна автоматическому апгрейду всех внутренних версий компонентов. Для этого требуется регулярный цикл `sync -> build -> smoke -> deploy`.

## 2) Документация (уровень и качество формулировок)

### Что уже в хорошем состоянии

- `README.md` (корень), `CUSTOMIZATION_MANIFEST.md`, `PLATFORM_SYNC_UPSTREAM.md`, `UPSTREAM_UPDATE_AND_SECURITY.md`, `PRODUCTION_SENIOR_PLAYBOOK.md`.
- Документы явно разделяют:
  - where-is-custom (`components/*`, `datalens/*`);
  - безопасный апдейт;
  - ограничения по лицензиям/Highcharts;
  - практики прод-эксплуатации.

### Что требует рефакторинга

- `datalens/README.md` содержит исторически накопленные блоки, дубли и длинные секции со смешанными режимами (demo/prod/dev), что затрудняет сопровождение.

### Рекомендация

- Оставить `datalens/README.md` как legacy reference, но вынести в отдельные документы:
  - `RUNBOOK_PROD.md`
  - `RUNBOOK_DEV.md`
  - `AUTH_MODES.md`
  - `BACKUP_AND_RESTORE.md`
  с перекрестными ссылками и без дублирования.

## 3) Безопасность (с учетом режима без `AUTH_ENABLED=true`)

Текущая модель в compose:

- Есть `AUTH_POLICY: disabled` для UI-потока.
- При этом используется `us-auth` и `US_MASTER_TOKEN`, то есть безопасность не «отсутствует», а смещена в периметр и внутренний контур.

### Риски

- При открытом внешнем доступе без жесткого периметра риск несанкционированного доступа высокий.
- Хранение токенов/секретов в `.env` требует строгого контроля файловых прав и ротации.
- На GitHub есть большие backup-файлы в истории; это повышает операционные и комплаенс-риски.

### Минимум hardening

1. Наружу только `443` (или `80` с redirect), внутренние порты закрыть firewall.
2. Ограничить доступ по IP/VPN.
3. Ротация `US_MASTER_TOKEN`, `AUTH_MASTER_TOKEN`, `POSTGRES_PASSWORD`, OIDC secrets.
4. Регулярный backup + тест восстановления.
5. Вынести тяжелые backup artifacts из git (LFS или внешнее хранилище).

## 4) Бэкапы/дампы: latest и previous по development

По tracked истории `origin/development` последние SQL backup-файлы:

- `datalens/backups/us-backup-2026-04-22_14-24-10.sql` (latest tracked)
- `datalens/backups/us-backup-2026-04-21_01-20-58.sql` (previous tracked)

Дополнительно перед синхронизацией создан технический dump:

- `datalens/backups/us-backup-2026-05-15_03-43-25.dump`

Для rollback git создан tag:

- `backup/pre-sync-20260515-034323` -> commit `82d2fb39...`

## 5) Чего не хватает до «зрелой BI-платформы»

1. CI-пайплайн «upstream sync + security gates + smoke tests».
2. Регулярный vulnerability scan образов (Trivy/Grype).
3. Метрики/алерты (availability, 5xx, latency, auth failures).
4. Полноценный DR-план (RPO/RTO, восстановление на чистом хосте).
5. Тестовый stage-контур, идентичный prod-конфигу.
6. Политика данных и доступа (RBAC + аудит операций).

## 6) Деплой из GitHub `SteGarXD/YDLOS`

Рациональный подход:

- Источник кода для «актуального кастомного состояния» — `github/main`.
- Деплой выполняется как:
  1) fetch `github/main`;
  2) сборка кастомных образов из этого состояния;
  3) `docker compose up -d --force-recreate` нужных сервисов;
  4) smoke checks (`/ping`, auth endpoints, UI).

## 7) Как видеть отставание/опережение (public + corp)

- Public: `SteGarXD/YDLOS (main)` vs `datalens-tech/datalens (main)` — метрика доступна напрямую (fork graph).
- Corp: `origin/development` можно сравнивать либо:
  - через mirror в GitHub (`github/main`), либо
  - через автоматический отчёт `sync-platform-upstream.sh`.

Рекомендуется:

- считать `github/main` канонической «метрикой ahead/behind» к upstream;
- `origin/development` — рабочей веткой интеграции;
- регулярный sync и зеркалирование между ними по регламенту.
