# Отличия YDLOS от aeronavigator/ydl-os (ветка development)

Сравнение: `git diff --name-status aeronavigator/development` и неотслеживаемые файлы.

---

## 1. Изменённые файлы (M) — в YDLOS относительно development

### datalens-auth
- `components/datalens-auth/Dockerfile`
- `components/datalens-auth/README.md`
- `components/datalens-auth/app/app.js`
- `components/datalens-auth/app/modules/authorize/basic-authorize.js`
- `components/datalens-auth/app/package.json`

### datalens-ui — auth, layout, endpoints
- `components/datalens-ui/src/i18n-keysets/auth.sign-in-custom/en.json`
- `components/datalens-ui/src/i18n-keysets/auth.sign-in-custom/ru.json`
- `components/datalens-ui/src/i18n-keysets/auth.sign-in/en.json`
- `components/datalens-ui/src/i18n-keysets/auth.sign-in/ru.json`
- `components/datalens-ui/src/server/components/auth/middlewares/auth/api-auth.ts`
- `components/datalens-ui/src/server/components/auth/middlewares/auth/ui-auth.ts`
- `components/datalens-ui/src/server/components/auth/routes.ts`
- `components/datalens-ui/src/server/components/layout/opensource-layout-config.ts`
- `components/datalens-ui/src/server/configs/opensource/common.ts`
- `components/datalens-ui/src/server/modes/opensource/app.ts`
- `components/datalens-ui/src/server/utils/routes.ts`
- `components/datalens-ui/src/shared/endpoints/constants/opensource.ts`
- `components/datalens-ui/src/shared/endpoints/index.ts`
- `components/datalens-ui/src/shared/schema/auth-schema/auth/actions.ts`
- `components/datalens-ui/src/shared/schema/auth-schema/auth/types.ts`
- `components/datalens-ui/src/ui/datalens/index.tsx`
- `components/datalens-ui/src/ui/libs/auth/refreshToken.ts`
- `components/datalens-ui/src/ui/libs/schematic-sdk/index.ts`
- `components/datalens-ui/src/ui/units/auth/components/Signin/CustomSignin.tsx`
- `components/datalens-ui/src/ui/units/auth/store/actions/signin.ts`
- `components/datalens-ui/tests/utils/playwright/datalens/utils.ts`

### datalens-us
- `components/datalens-us/src/utils/utils.ts`

### datalens (скрипты и конфиг)
- `datalens/.env.example`
- `datalens/build-and-run-ui.ps1`
- `datalens/docker-compose.demo.yaml`
- `datalens/docker-compose.yaml`

---

## 2. Удалённые в YDLOS (D) — есть в development, в текущем дереве нет

Файлы бэкапов US (в development они закоммичены, у нас удалены или не добавлены):

- `datalens/backups/us-backup-2026-03-05_01-57-49.sql`
- `datalens/backups/us-backup-2026-03-05_02-05-01.sql`
- `datalens/backups/us-backup-2026-03-05_02-10-22.sql`
- `datalens/backups/us-backup-2026-03-05_02-14-18.sql`
- `datalens/backups/us-backup-2026-03-05_02-20-48.sql`
- `datalens/backups/us-backup-2026-03-05_02-24-56.sql`
- `datalens/backups/us-backup-2026-03-05_02-30-35.sql`
- `datalens/backups/us-backup-2026-03-05_02-34-16.sql`
- `datalens/backups/us-backup-2026-03-05_02-36-44.sql`
- `datalens/backups/us-backup-2026-03-05_02-39-28.sql`
- `datalens/backups/us-backup-2026-03-05_02-41-50.sql`
- `datalens/backups/us-backup-2026-03-05_02-44-00.sql`
- `datalens/backups/us-backup-2026-03-05_02-47-52.sql`
- `datalens/backups/us-backup-2026-03-05_02-50-32.sql`
- `datalens/backups/us-backup-2026-03-05_03-01-08.sql`
- `datalens/backups/us-backup-2026-03-05_03-05-27.sql`
- `datalens/backups/us-backup-2026-03-05_03-10-46.sql`
- `datalens/backups/us-backup-2026-03-05_03-17-25.sql`

(18 файлов)

---

## 3. Неотслеживаемые в YDLOS (??) — только локально, в репозитории нет

### datalens-auth
- `components/datalens-auth/BUILD-AUTH.md`
- `components/datalens-auth/app/routes/datalens-auth.js`

### datalens-ui — auth
- `components/datalens-ui/src/server/components/auth/auth-gateway-handler.ts`
- `components/datalens-ui/src/server/components/auth/middlewares/gateway-cookie-to-header.ts`

### datalens
- `datalens/TROUBLESHOOTING.md`
- `datalens/build-and-run-us.ps1`
- `datalens/scripts/build-us-auth-windows.ps1`
- `datalens/scripts/cleanup-docker-and-rebuild.ps1`
- `datalens/scripts/compact-docker-vhdx.ps1`
- `datalens/scripts/create-auth-master.ps1`
- `datalens/scripts/free-disk-space.ps1`
- `datalens/scripts/list-auth-users.ps1`
- `datalens/scripts/reset-auth-password.ps1`
- `datalens/scripts/run-demo-clean.ps1`
- `datalens/backups/us-backup-2026-03-17_*.sql` (много файлов — локальные бэкапы)

---

## Итого

| Категория | Количество |
|-----------|------------|
| Изменённые (M) | 30 |
| Удалённые в YDLOS (D) | 18 |
| Неотслеживаемые (??) | 30+ (включая бэкапы 2026-03-17) |

Работа ведётся только в папке YDLOS (IDE). Highcharts отключены: `HC=0`, `HC_ENDPOINT=`, `HC_PROTOCOL=https` в `datalens/.env`.
