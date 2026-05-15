# Execution Log (2026-05-14)

This document records the exact hardening steps completed for long-term safe updates and custom feature protection.

## Completed steps

1. UI custom state was captured and committed in `datalens-ui-src` branch `development`.
2. Local UI image was built from custom sources:
   - `akrasnov87/datalens-ui:0.3498.0-local-20260514`
3. Both repositories were moved to a standard remote topology:
   - `origin`: private product repository (`git.aeronavigator.ru`)
   - `upstream`: official `datalens-tech`
   - `vendor`: `akrasnov87`
4. Platform repository was switched to `development` branch.
5. Recovery and update documentation was added:
   - `docs/PLATFORM_BRANCHING_AND_UPDATES.md`
   - `docs/PLATFORM_RECOVERY_RUNBOOK.md`
   - `docs/CUSTOMIZATION_MANIFEST.md`
6. Automation scripts were added:
   - `scripts/backup/backup-custom-state.sh`
   - `scripts/backup/restore-custom-state.sh`
   - `scripts/git/sync-upstream-into-development.sh`
7. UI-side safety docs and snapshot automation were added:
   - `CUSTOM_SYNC_POLICY.md`
   - `scripts/maintenance/create-custom-snapshot.sh`
8. Safety tags were created locally:
   - `snapshot-ui-before-upstream-20260514`
   - `snapshot-platform-before-upstream-20260514`

## Operational notes

- Remote fetch from `github.com` and authenticated fetch from `git.aeronavigator.ru` require working network/DNS/auth in the runtime environment.
- Existing untracked local infrastructure files were intentionally not modified or committed.

