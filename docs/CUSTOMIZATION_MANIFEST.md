# Customization Manifest

This manifest is the single source of truth for product-specific behavior that must survive upstream synchronization.

## Core custom domains

- Branding:
  - logos
  - product naming
  - style overrides
- Access model:
  - role model extensions
  - project/profile access logic
  - custom group editor behavior
- Dashboard layer:
  - default templates
  - custom dashboard profiles
  - UX-level custom actions/buttons
- Data connectors and SQL behavior:
  - MSSQL-specific adjustments
  - connector defaults and limits
- Language/localization:
  - Russian UI defaults
  - localized labels/messages

## Operational guarantees

- Every customization must be represented in git code or backup scripts.
- Dashboard/metadata state must be backed up via `scripts/backup`.
- Before upstream rebase:
  1. create backup
  2. tag current state
  3. run update flow from `docs/PLATFORM_BRANCHING_AND_UPDATES.md`
- After rebase:
  1. restore backup in staging if needed
  2. run smoke validation
  3. push only after validation

