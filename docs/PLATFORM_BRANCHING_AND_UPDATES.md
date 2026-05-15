# Platform Branching and Update Policy

This repository uses a three-remote model and a strict branch contract to keep custom functionality safe while regularly syncing from official DataLens.

## Remote model

- `origin`: private product repository (`https://git.aeronavigator.ru/Aeronavigator/ydl-os.git`)
- `upstream`: official DataLens (`https://github.com/datalens-tech/datalens.git`)
- `vendor`: additional feature source (`https://github.com/akrasnov87/datalens`)

## Branch contract

- `main`: mirror of `upstream/main` only. No direct custom commits.
- `development`: integration branch for all custom product behavior.
- `release/*`: production-ready snapshots cut from `development`.
- `hotfix/*`: urgent fixes cut from the active `release/*`.
- `feature/*`: short-lived branches for isolated changes.

## Golden update flow

1. Refresh remotes:
   - `git fetch upstream`
   - `git fetch vendor`
2. Update mirror branch:
   - `git checkout main`
   - `git merge --ff-only upstream/main`
3. Rebase custom branch on the fresh mirror:
   - `git checkout development`
   - `git rebase main`
4. Resolve conflicts in favor of product requirements (branding, auth model, role model, custom widgets, integrations).
5. Run smoke verification:
   - platform starts
   - auth and roles work
   - key dashboards open
   - custom editors/forms work
   - export/report features work
6. Commit conflict resolutions with explicit rationale.
7. Promote to `release/*` only after validation.

## Rules that prevent custom loss

- Keep every customization as explicit code (no "manual patch only" changes).
- Keep dashboards/metadata as versioned exports (see `scripts/backup`).
- Never develop directly on `main`.
- Keep changes small and thematic so rebases remain predictable.
- Tag important restore points before major updates.

