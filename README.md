# YDLOS — дистрибутив DataLens Open Source

**YDLOS** — self-hosted дистрибутив [DataLens OSS](https://github.com/datalens-tech/datalens): официальный submodule `vendor/` плюс тонкий слой кастомизации (compose, UI-патчи, профили).

Текущий upstream pin: **release 2.9.0** (UI `0.3831.0`, US `1.39.0`, auth `0.27.0`).

---

## Для кого этот репозиторий

| Аудитория | Что читать |
|-----------|------------|
| **Бизнес-пользователи и аналитики** | Возможности платформы, воркбуки, датасеты — [docs/README.md](docs/README.md) |
| **Администраторы** | Установка, резервное копирование, лимиты — [docs/ops/](docs/ops/) |
| **Разработчики DataLens / OSS** | Архитектура overlay, политика upstream PR — [docs/dev/upstream-ready-repository.md](docs/dev/upstream-ready-repository.md) |
| **Контрибьюторы в datalens-tech** | [docs/dev/CONTRIBUTING_UPSTREAM.md](docs/dev/CONTRIBUTING_UPSTREAM.md) |

Это **санитизированный экспорт** полной платформы: upstream-ready улучшения без внутреннего брендинга, приватных профилей дашбордов и корпоративных runbook'ов. См. [docs/dev/PUBLIC_REPO_SCOPE.md](docs/dev/PUBLIC_REPO_SCOPE.md).

Официальная документация DataLens: https://datalens.ru/opensource/docs/ru/

---

## Архитектура

```text
vendor/datalens/           submodule (datalens-tech/datalens, только bump)
overlay/
  platform/                compose, nginx, profiles, deploy scripts
  patches/datalens-ui/     исходники UI-патчей (сборка на официальном UI tag)
  packages/                feature registry, extensions
integration/               build, acceptance, e2e
docs/                      пользовательская и инженерная документация
```

**Принцип:** не форкать монорепозиторий DataLens. Универсальные изменения — в `datalens-tech` через PR; специфичное для установки — в overlay.

Подробнее: [docs/OVERLAY_ARCHITECTURE.md](docs/OVERLAY_ARCHITECTURE.md)

---

## Быстрый старт (dev / test)

```bash
git clone --recurse-submodules https://github.com/SteGarXD/YDLOS.git
cd YDLOS

cp overlay/platform/.env.example overlay/platform/.env
# задайте пароли, OIDC_*, POSTGRES_* для вашего окружения

bash integration/check-version-alignment.sh
bash integration/publish-ui-overlay-dist.sh
bash integration/compose.sh up -d
bash integration/platform-acceptance.sh
```

Руководство по установке: [docs/ops/ustanovka.md](docs/ops/ustanovka.md)

---

## Профили установки

```bash
YDL_PROFILE=default       # admin, export, HC=0
YDL_PROFILE=portal        # OIDC viewers, iframe workbooks

bash integration/apply-ydl-profile.sh overlay/platform/.env
```

Профили: [overlay/platform/profiles/README.md](overlay/platform/profiles/README.md)

---

## Сборка UI (official + patches)

Полный UI **не хранится в git**. Pipeline:

1. Clone `datalens-tech/datalens-ui@v<uiVersion>` (из vendor pin).
2. Apply `overlay/patches/datalens-ui/*`.
3. `npm run build` → Docker image `ydl/datalens-ui:<tag>`.

```bash
bash integration/publish-ui-overlay-dist.sh
```

---

## Синхронизация с upstream

```bash
bash integration/update-vendor.sh main
bash integration/check-version-alignment.sh
bash integration/publish-ui-overlay-dist.sh
```

Перед production upgrade: backup Postgres (US/auth). См. [docs/ops/rezervnoe-kopirovanie.md](docs/ops/rezervnoe-kopirovanie.md).

Политика: [docs/dev/politika-overlay-i-vendor.md](docs/dev/politika-overlay-i-vendor.md)

---

## Контрибьюция в datalens-tech

- Один PR — одна тема, English, tests, CLA.
- После merge в upstream — удалить соответствующий патч из YDLOS.
- Style guide: [docs/dev/CONTRIBUTING_UPSTREAM.md](docs/dev/CONTRIBUTING_UPSTREAM.md)

---

## Лицензия

Ядро DataLens — [Apache 2.0](https://github.com/datalens-tech/datalens/blob/main/LICENSE).  
Overlay YDLOS — см. лицензионные условия вашей организации для deployment-specific слоёв.

---

---

# YDLOS — DataLens Open Source Distribution

**YDLOS** is a self-hosted distribution of [DataLens OSS](https://github.com/datalens-tech/datalens): official `vendor/` submodule plus a thin customization overlay (compose, UI patches, profiles).

Current upstream pin: **release 2.9.0** (UI `0.3831.0`, US `1.39.0`, auth `0.27.0`).

---

## Who this repository is for

| Audience | What to read |
|----------|----------------|
| **Business users & analysts** | Platform capabilities, workbooks, datasets — [docs/README.md](docs/README.md) |
| **Administrators** | Installation, backup, limits — [docs/ops/](docs/ops/) |
| **DataLens / OSS developers** | Overlay architecture, upstream PR policy — [docs/dev/upstream-ready-repository.md](docs/dev/upstream-ready-repository.md) |
| **Contributors to datalens-tech** | [docs/dev/CONTRIBUTING_UPSTREAM.md](docs/dev/CONTRIBUTING_UPSTREAM.md) |

This public tree is a **sanitized export** of the full platform. It contains upstream-ready improvements without organization-specific branding, private dashboard profiles, or internal runbooks. See [docs/dev/PUBLIC_REPO_SCOPE.md](docs/dev/PUBLIC_REPO_SCOPE.md).

Official DataLens documentation: https://datalens.ru/opensource/docs/ru/

---

## Architecture

```text
vendor/datalens/           submodule (datalens-tech/datalens, bump only)
overlay/
  platform/                compose, nginx, profiles, deploy scripts
  patches/datalens-ui/     UI patch sources (built on official UI tag)
  packages/                feature registry, extensions
integration/               build, acceptance, e2e
docs/                      user and engineering documentation
```

**Principle:** do not fork the DataLens monorepo. Universal changes go to `datalens-tech` via PR; installation-specific code stays in the overlay.

Details: [docs/OVERLAY_ARCHITECTURE.md](docs/OVERLAY_ARCHITECTURE.md)

---

## Quick start (dev / test)

```bash
git clone --recurse-submodules https://github.com/SteGarXD/YDLOS.git
cd YDLOS

cp overlay/platform/.env.example overlay/platform/.env
# set passwords, OIDC_*, POSTGRES_* for your environment

bash integration/check-version-alignment.sh
bash integration/publish-ui-overlay-dist.sh
bash integration/compose.sh up -d
bash integration/platform-acceptance.sh
```

Installation guide: [docs/ops/ustanovka.md](docs/ops/ustanovka.md)

---

## Installation profiles

```bash
YDL_PROFILE=default       # admin, export, HC=0
YDL_PROFILE=portal        # OIDC viewers, iframe workbooks

bash integration/apply-ydl-profile.sh overlay/platform/.env
```

Profiles: [overlay/platform/profiles/README.md](overlay/platform/profiles/README.md)

---

## UI build (official + patches)

The full UI is **not** stored in git. Build pipeline:

1. Clone `datalens-tech/datalens-ui@v<uiVersion>` (from vendor pin).
2. Apply `overlay/patches/datalens-ui/*`.
3. `npm run build` → Docker image `ydl/datalens-ui:<tag>`.

```bash
bash integration/publish-ui-overlay-dist.sh
```

---

## Upstream sync

```bash
bash integration/update-vendor.sh main
bash integration/check-version-alignment.sh
bash integration/publish-ui-overlay-dist.sh
```

Before production upgrade: backup Postgres (US/auth). See [docs/ops/rezervnoe-kopirovanie.md](docs/ops/rezervnoe-kopirovanie.md).

Policy: [docs/dev/politika-overlay-i-vendor.md](docs/dev/politika-overlay-i-vendor.md)

---

## Contributing to datalens-tech

- One PR — one topic, English, tests, CLA.
- After upstream merge — remove the corresponding patch from YDLOS.
- Style guide: [docs/dev/CONTRIBUTING_UPSTREAM.md](docs/dev/CONTRIBUTING_UPSTREAM.md)

---

## License

DataLens core — [Apache 2.0](https://github.com/datalens-tech/datalens/blob/main/LICENSE).  
YDLOS overlay — see your organization's license terms for deployment-specific layers.
