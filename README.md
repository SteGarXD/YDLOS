# YDL OS (Aeronavigator BI)

Production-focused fork of [datalens-tech/datalens](https://github.com/datalens-tech/datalens) with enterprise customizations:

- custom UI branding and auth flow
- operational scripts for safe upstream sync
- deployment profile for single-host production (`/opt/ydl-os`)

## Repository Layout

- `components/` — source code of forked services (`datalens-ui`, `datalens-auth`, `datalens-us`, backend libs)
- `datalens/` — deployment configs, runbooks, scripts, Terraform and operational docs

## Quick Links

- Platform runbook: [`datalens/README.md`](datalens/README.md)
- Customization map: [`datalens/CUSTOMIZATION_MANIFEST.md`](datalens/CUSTOMIZATION_MANIFEST.md)
- Upstream sync process: [`datalens/PLATFORM_SYNC_UPSTREAM.md`](datalens/PLATFORM_SYNC_UPSTREAM.md)
- Security and prod operations: [`datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md`](datalens/docs/PRODUCTION_SENIOR_PLAYBOOK.md)
- Current platform audit: [`datalens/docs/PLATFORM_AUDIT_2026-05-15.md`](datalens/docs/PLATFORM_AUDIT_2026-05-15.md)

## Production Endpoint

- External URL: [https://bi.aeronavigator.ru](https://bi.aeronavigator.ru)
- Edge reverse proxy: host Nginx -> internal `ydl-os-nginx` (`:80`)

## Contribution Quality Bar

For changes intended for public sharing:

1. update code and docs in one PR
2. provide migration notes for operators
3. include smoke checks and rollback path
4. avoid ambiguous commit messages
