# YDL OS Runtime and Operations Guide

This directory contains deployment runtime for Aeronavigator BI (YDL OS), built on top of `datalens-tech/datalens` with custom UI/auth behavior.

## 1. Scope

- Production compose stack and overrides
- Build and deployment scripts
- Security and operations runbooks
- Backup and recovery tooling

## 2. Core Runtime

- Compose root: `datalens/docker-compose.yaml`
- Production override: `datalens/docker-compose.production.yaml`
- Edge proxy: `ydl-os-nginx` (host `:80` -> internal UI)
- Primary persistent data: Docker volume `datalens-volume-prod` (PostgreSQL metadata)

## 3. Required Operator Documents

- Upstream sync process: [`PLATFORM_SYNC_UPSTREAM.md`](PLATFORM_SYNC_UPSTREAM.md)
- Customization map: [`CUSTOMIZATION_MANIFEST.md`](CUSTOMIZATION_MANIFEST.md)
- Security update model: [`docs/UPSTREAM_UPDATE_AND_SECURITY.md`](docs/UPSTREAM_UPDATE_AND_SECURITY.md)
- Production security playbook: [`docs/PRODUCTION_SENIOR_PLAYBOOK.md`](docs/PRODUCTION_SENIOR_PLAYBOOK.md)
- Data persistence and restore: [`docs/DATA-PERSISTENCE.md`](docs/DATA-PERSISTENCE.md)
- Current platform audit: [`docs/PLATFORM_AUDIT_2026-05-15.md`](docs/PLATFORM_AUDIT_2026-05-15.md)

## 4. Standard Production Deploy

From server working copy:

```bash
cd /home/g.stepanov/datalens/datalens
docker compose -f docker-compose.yaml -f docker-compose.production.yaml up -d --force-recreate
```

From GitHub `main` snapshot (`SteGarXD/YDLOS`):

```bash
bash scripts/ydl-os/redeploy-from-github-main.sh
```

Deployment source is stamped to:

- `/opt/ydl-os/.ydl-deploy-source`

## 5. Upstream Sync and Commit Divergence

Generate sync report:

```bash
bash scripts/ydl-os/sync-platform-upstream.sh
```

Generate compact ahead/behind report:

```bash
bash scripts/ydl-os/commit-divergence-report.sh
```

## 6. Nightly Maintenance

Includes:

- divergence report
- nightly US dump
- retention rotation
- smoke checks

Install cron entry:

```bash
bash scripts/ydl-os/install-nightly-cron.sh
```

Manual run:

```bash
bash scripts/ydl-os/nightly-maintenance.sh
```

## 7. Backup Policy (Minimum)

Before any platform update:

1. create PostgreSQL dump
2. preserve known-good SQL backup pair (latest + previous)
3. verify restore path on staging

Working backup locations:

- `datalens/backups/`
- `datalens/backups/preserved-development/`
- `datalens/backups/nightly/`

## 8. Security Notes for Auth Modes

The platform may run with disabled cloud auth flow, but this requires compensating controls:

- strict network perimeter (VPN/IP allowlist)
- secrets rotation
- central logs and alerts
- regular restore drills

See full details in:

- [`docs/UPSTREAM_UPDATE_AND_SECURITY.md`](docs/UPSTREAM_UPDATE_AND_SECURITY.md)
- [`docs/PRODUCTION_SENIOR_PLAYBOOK.md`](docs/PRODUCTION_SENIOR_PLAYBOOK.md)

## 9. Public Sharing Readiness

For external users/developers:

- keep this README concise and operational
- document every non-obvious custom behavior in dedicated runbooks
- ship reproducible scripts, smoke checks, and rollback path
