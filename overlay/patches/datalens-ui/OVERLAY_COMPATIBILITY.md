# Overlay compatibility with upstream DataLens

Base tag: `versions-config.json` → official `datalens-tech/datalens-ui`.

**Структура overlay, path ownership, PR workflow:** `OVERLAY_LAYERING.md`.

## Principles

1. **Upstream first** — vanilla Yandex DataLens behaviour must stay unchanged unless a dashboard explicitly needs corp runtime.
2. **Explicit gates** — org-workbooks/MSSQL logic runs only when `shouldApplyCorpDashRuntime()`, `shouldApplyProfileSelectorCascade()`, or scoped helpers (see `corp-dash-profile/.../corpRuntimeGate.ts`, `profileSelectorCascade.ts`).
3. **Modular patches** — each change lives in one overlay module with a documented *why*; no `legacy-bulk` rsync (`YDL_APPLY_LEGACY_BULK` is retired).
4. **Minimal surface** — prefer hooks/registry/git patches over full-file forks; delete overlay code when upstream merges the PR.
5. **Green build per batch** — promote `legacy-candidates/` → `src/` only after TypeScript + integration build pass on the current upstream tag.

## When corp logic runs

| Signal | Meaning |
|--------|---------|
| `ydlProfile` in dash entry (`kind: DashboardProfile`) | Explicit contract: selectors, cascade, permissions |
| Selector param keys `grp`, `nrs`, `groupname`, `dta1`, … in dash config | org-workbooks workbook auto-detection |
| Neither | **Upstream path** — no defaults augmentation, no MSSQL alias sanitizers |

## Module responsibilities

| Module | Upstream impact | Gate |
|--------|-----------------|------|
| `corp-dash-profile` | Widget `defaults` / selector keys merge | `shouldApplyCorpDashRuntime` |
| `corp-selector-cascade` | Profile disable + downstream reset in GroupControl | `shouldApplyProfileSelectorCascade` |
| ~~`client-dash-selectors`~~ | **Removed** (2026-06) — replaced by `corp-selector-cascade` |
| `charts-params` | `flat-table-row-tree-state.ts` only (table tree UI) | — |
| `client-features` | Dataset validation toast | Parameter 400 only, preview must have rows |
| `client-viz-corp` | ChartKit table, chart hooks | Corp viz entries / org-workbooks charts |
| `layout-branding` | HTML early guards | Console noise only; no API changes |
| `ydl-only` | Flight groups editor | Registry plugin; not in upstream DashActionPanel |

## Adding a new patch

1. Choose module (see `CORPORATE_PATCHES.md` classification).
2. Add file under `<module>/src/…` mirroring upstream path.
3. If behaviour differs from upstream for **all** users, add a gate in `corpRuntimeGate.ts` or document profile-only scope.
4. Add a short header comment: `// OVERLAY(PRIVATE|UPSTREAM): <why>`.
5. Run `YDL_UI_CLIENT_BUILD=1 bash integration/build.sh`.

## Removing harmful overrides

If overlay breaks vanilla dashboards:

- **Remove** the override and use upstream file from `.cache/datalens-ui/v*`.
- **Or gate** behind `shouldApplyCorpDashRuntime` / `shouldApplyProfileSelectorCascade`.
- **Or reimplement** as registry hook / plugin (see `ydl-only/registerYdlCorp.ts`).

## legacy-candidates

Files in `*/legacy-candidates/` are **not active**. They are inventory for porting. Each port must:

- Compile on current upstream tag
- Be gated if not org-workbooks-specific
- Replace a documented upstream gap, not duplicate working upstream code

## Verification

```bash
bash integration/verify-vendor-pristine.sh
YDL_UI_CLIENT_BUILD=1 bash integration/build.sh
# Prod must use YDL_UI_IMAGE from .ydl-built-images.env (corp tag, not ghcr.io bare datalens-ui)
```
