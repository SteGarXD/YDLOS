# Public repository scope (SteGarXD/YDLOS)

This tree is a **sanitized export** of the full YDLOS platform. It is published to GitHub for:

- DataLens OSS contributors and reviewers (`datalens-tech`)
- Self-hosted administrators evaluating the overlay approach
- Business analysts reading generic BI documentation

## Included

- Vendor pin and sync scripts
- Generic overlay platform (compose, profiles skeleton, build pipeline)
- Upstream-ready UI patches (date controls, export plumbing, etc.)
- Public documentation (`docs/README.public.md` scope)

## Excluded (corporate / private only)

- Internal hostnames, IP addresses, SSH deploy targets
- Organization branding and private dashboard profiles
- Private chart preparers and corp-only UI patches
- Internal runbooks (`docs/corp/`, prod nginx tickets, MSSQL host details)
- Organization-specific US patch scripts

The **authoritative full deployment** lives in the organization’s private Git server.

## Regenerate public export

```bash
bash overlay/platform/scripts/ydl-os/sync-dual-repos.sh --push-public
```

See corporate `docs/corp/publikaciya-repozitoriev.md` (not in this export).
