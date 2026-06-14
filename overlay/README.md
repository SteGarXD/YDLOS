# YDL OS overlay layer

All customizations that are **not** in official `datalens-tech/datalens`.

- `components/` — service source code you build and deploy
- `platform/` — runtime (compose overrides, profiles, scripts, docs, CI)
- `infra/` — auxiliary compose, exports, recovery docs (no Airflow)

Official platform code is **only** in `../vendor/datalens` (git submodule).
