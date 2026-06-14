# YDL OS — overlay architecture

Official DataLens: `vendor/datalens` (read-only submodule @ release tag).  
Customizations: `overlay/`. Build and wiring: `integration/`.

## Dashboard profiles

- Each file in `overlay/platform/profiles/extracted/*.profile.json` is **unique** to an installation.
- **New dashboard:** build in BI, then extract profile metadata to JSON (organization-specific tooling).
- Git → validate → sync to US (Universal Storage).

## Deployment layout

- **Source:** this git repository (vendor submodule + overlay).
- **Runtime:** Docker Compose stack (`overlay/platform/docker-compose.yaml` + production overlay).
- **Secrets:** `.env` on the host (never commit `.env.local` or production passwords).

Organization-specific production paths and hostnames — in internal documentation (`docs/corp/` on private Git only).
