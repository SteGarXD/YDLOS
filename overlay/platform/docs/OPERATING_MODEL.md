# YDL OS — операционная модель (vendor + overlay)

Пользовательская документация (RU): [docs/README.md](../../../docs/README.md).

Расширения и кастом: [OSS_EXTENDED_FEATURES.md](./OSS_EXTENDED_FEATURES.md), [overlay-inventory.md](./overlay-inventory.md), [NAMING_POLICY.md](./NAMING_POLICY.md).

См. также [UPSTREAM_PR_MATRIX.md](./UPSTREAM_PR_MATRIX.md).

## Канонический стек (prod)

```bash
git submodule update --init --recursive
bash integration/verify-vendor-pristine.sh
bash integration/sync-official-image-pins.sh
bash integration/build.sh
bash integration/compose.sh up -d
```

Compose (через `integration/lib/compose-files.sh`):

1. `vendor/datalens/docker-compose.yaml`
2. `compose/docker-compose.ydl-platform.yaml`
3. `compose/docker-compose.production.yaml` (nginx :80)
4. `compose/docker-compose.official-images.yaml` (ghcr infra)
5. `compose/docker-compose.ydl-built-images.yaml` (ui, us, us-auth)
6. `compose/docker-compose.security-hardening.yaml` (optional)

**Не использовать** `compose/docker-compose.akrasnov87-images.yaml` на проде (legacy 2.7.0).

## Обновление vendor

```bash
bash integration/update-vendor.sh v2.9.0
bash overlay/platform/scripts/ydl-os/sync-platform-upstream.sh
bash integration/build.sh
bash integration/release-full.sh
```

## Миграция US 1.39 + официальный Auth

Отдельный осознанный контур (не то же самое, что `update-vendor`):

- Документация: [docs/MIGRATION_US_AUTH_1.39.md](./MIGRATION_US_AUTH_1.39.md)
- `bash integration/migrate-to-official-stack.sh report`
- `bash integration/rebase-us-from-upstream.sh` → `--execute` только на ветке после бэкапа

## PR в datalens-tech

```bash
bash integration/upstream-prepare-pr.sh
```
