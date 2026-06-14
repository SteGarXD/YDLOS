# Contributing to datalens-tech (official style)

**Audience:** developers preparing PRs from YDLOS work.

YDLOS is a **distribution**; universal improvements belong in **datalens-tech** repositories.

## Before opening a PR

1. Staging proof — feature works on real stack ([politika-pr-i-obnovlenij.md](politika-pr-i-obnovlenij.md)).
2. `vendor/datalens` **behind=0**.
3. One concern per PR (one chart type, one env, one setting).
4. Match upstream patterns — read the closest existing module @ `uiVersion`.

## PR description (English)

```markdown
## What
- Add <feature> for opensource installation

## Why
- Self-hosted users need <...> (link issue if any)

## How
- Follows pattern from `preparers/pie/` (or relevant path)
- HC=0 path uses gravity-charts / d3

## Test plan
- [ ] opensource-suites / unit tests
- [ ] Manual: create chart, preview, export
```

## Code style

- TypeScript strict, same eslint as `datalens-ui`.
- Tests beside preparers (`__tests__`).
- i18n: keysets, not hardcoded Russian in shared modules.
- No vendor-specific branding in universal PRs.

## Repositories

| Change | Repo |
|--------|------|
| Chart types, wizard, UI | datalens-tech/datalens-ui |
| Connectors, APIs | datalens-tech/datalens-backend |
| Compose, env defaults | datalens-tech/datalens |
| US permissions | datalens-tech/datalens-us |

## After merge

```bash
bash integration/update-vendor.sh
bash integration/publish-ui-overlay-dist.sh
# remove duplicated patch from overlay
```

Goal: be listed as **maintainer-quality** contributor — small, tested, documented PRs.
