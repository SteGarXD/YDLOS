# Platform Recovery Runbook

This runbook defines how to rebuild the platform from zero and recover custom behavior quickly.

## 1) Prerequisites

- Docker Engine + Docker Compose plugin.
- Access to:
  - private product repo (`origin`)
  - official upstream (`upstream`)
  - optional vendor source (`vendor`)
- Secrets available outside git (`.env`, tokens, DB passwords, crypto keys).

## 2) Clone and remote setup

```bash
git clone https://git.aeronavigator.ru/Aeronavigator/ydl-os.git
cd ydl-os
git remote add upstream https://github.com/datalens-tech/datalens.git
git remote add vendor https://github.com/akrasnov87/datalens
```

## 3) Recover code state

```bash
git checkout development
```

If `development` is absent locally:

```bash
git fetch origin
git checkout -b development origin/development
```

## 4) Recover metadata and custom assets

Create a backup bundle before every risky operation:

```bash
./scripts/backup/backup-custom-state.sh ./backup-output
```

Restore from an existing backup bundle:

```bash
./scripts/backup/restore-custom-state.sh ./backup-output/latest
```

## 5) Start stack and validate

```bash
HC=1 docker compose up -d
```

Minimum validation checklist:

- login and role mapping works
- custom dashboards load correctly
- custom branding/logo is visible
- custom editors/forms behave correctly
- key data sources (including MSSQL-specific scenarios) pass smoke checks

## 6) Periodic update from official upstream

```bash
git fetch upstream
git checkout main
git merge --ff-only upstream/main
git checkout development
git rebase main
```

Then execute backup + smoke checks before pushing.

