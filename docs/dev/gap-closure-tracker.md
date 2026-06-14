# Трекер закрытия gaps (official-first)

**Мастер-план TOP-1 (фазы 0–15):** [ydlos-master-plan.md](ydlos-master-plan.md).

**Северная звезда:** платформа обновляется с `datalens-tech` без боли; кастом — profiles + whitelist publish. **PR в upstream — после** рабочей платформы ([strategiya-platforma-bez-pr-snachala.md](strategiya-platforma-bez-pr-snachala.md)).

Сравнение с Cloud / on-prem: [DataLens-editions-matrix.md](DataLens-editions-matrix.md).

Статусы: **DONE** | **STAGING** | **UPSTREAM** | **PRIVATE** | **CONFIG**

## Платформа и обновления

| Gap | Статус | Как закрыто |
|-----|--------|-------------|
| Vendor behind official | DONE | `check-version-alignment` fail if behind>0 |
| UI на ghcr base | DONE | `publish-ui-overlay-dist.sh` |
| Настройка без исходников | DONE | `YDL_PROFILE` + `apply-ydl-profile.sh` |
| Политики PR/staging | DONE | `politika-*` docs |
| Толстый overlay UI | STAGING | modular overlay + verify-overlay-health; сжимать через PR |
| Selector cascade + gates | DONE | corp-selector-cascade, profileSelectorCascade, gated migrate |
| Overlay health CI | DONE | integration/verify-overlay-health.sh |
| DashboardProfile US sync | DONE | integration/sync-dashboard-profiles.sh (auto PG port) |

## Auth / users / roles / projects

| Gap | Статус | Как закрыто |
|-----|--------|-------------|
| Пользователи | DONE | official auth 0.27 |
| Роли datalens.* | DONE | `/settings`, assign script |
| Проекты pd_* | N/A | **Не цель** — workbook + US + RLS — [scenariy-portal-oidc-us-rls.md](scenariy-portal-oidc-us-rls.md) |
| Legacy admin | N/A default | `ENABLE_LEGACY_PD_RBAC=0`; не использовать на prod |
| Миграция pd_* | N/A | Не нужна без legacy-форка |
| OIDC ×4 + viewer default | DONE | compose + [scenariy-portal-oidc-us-rls.md](scenariy-portal-oidc-us-rls.md) |
| Портал: 1 workbook + US ACL | STAGING | `sync-us-permissions.sh` + manual Share UI; см. [dostup-kontenta.md](dostup-kontenta.md) |
| RLS airline / flight groups | ROADMAP | `dim_user_scope` + dataset param `__user_id` — [wizard-rls-parametry-dataset.md](wizard-rls-parametry-dataset.md) |
| Share / related | DONE | overlay; smoke on staging |
| QL __user_id / __embed | STAGING | overlay; PR queue P0 |

## BI / export / limits

| Gap | Статус | Как закрыто |
|-----|--------|-------------|
| HC=0 | DONE | profile default |
| Export excel/workbook | DONE | env |
| Лимиты self-hosted | DONE | env + docs |
| Metrics | CONFIG | `ydl-metrics` compose |
| Все коннекторы visible | DONE | control-api env |

## Визуализации (100 типов)

| Gap | Статус | Как закрыто |
|-----|--------|-------------|
| ~37 official types @ HC=0 | DONE | catalog script |
| +N новых типов | UPSTREAM | [workflow-dobavlenie-tipa-vizualizacii.md](workflow-dobavlenie-tipa-vizualizacii.md) — по одному, PR в конце |
| «Все библиотеки мира» | N/A | не цель продукта; QL для экзотики |

## Gaps vs Cloud / on-prem (письмо Yandex)

| Gap | Статус | Примечание |
|-----|--------|------------|
| Usage Analytics | ❌ ROADMAP | отдельный сервис |
| Report builder PDF/presentations | 🔶 PARTIAL | PDF D3 chart only |
| Editor JS + API connector | ❌ ROADMAP | большой модуль |
| UI styling (full) | 🔶 PARTIAL | profiles/branding |
| Mailings scheduled | ❌ ROADMAP | Q1 2026 cloud |
| Extracts / file upload | ❌ ROADMAP | on-prem H1 |
| Secure embed 1:1 cloud | 🔶 STAGING | share overlay |
| User groups | ❌ ROADMAP | |
| Кастомные роли + проекты | N/A | не требуется для портала; см. master-plan |

Матрица: [DataLens-editions-matrix.md](DataLens-editions-matrix.md).

## P1–P2 (мега-бэклог)

| Gap | Статус |
|-----|--------|
| Глобальный поиск | ROADMAP |
| API tokens | ROADMAP |
| MSSQL upstream connector | ROADMAP |
| Helm values overlay | CONFIG/docs |
| Корзина UX | ROADMAP |
| Flight groups | PRIVATE DONE |

## «ТОП-1 BI» — декомпозиция (см. ydlos-master-plan v2)

| Веха | Фазы | Содержание |
|------|------|------------|
| v1.0 Portal | 0–3, 2 | OIDC, RLS, export, patches |
| v2.0 Enterprise | +4,5,7,10 | UX, data platform, embed, governance |
| v3.0 Monster | +6,8,9,11,12 | reports, mailings, viz, AI, perf |
| v4.0 Leader | 13–14 | overlay минимален, upstream |

Столпы P1–P12 и каталог A–K → фазы: [ydlos-master-plan.md](ydlos-master-plan.md) §5–6.

Облачный паритет 1:1 — **не цель**; цель — **лучший OSS-дистрибутив** + enterprise-сервисы + UX.

Обновлять этот файл при закрытии gap.
