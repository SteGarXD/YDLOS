# YDLOS для ревьюера datalens-tech

YDLOS — **дистрибутив**, не fork monorepo. Ядро: submodule `vendor/datalens` → [datalens-tech/datalens](https://github.com/datalens-tech/datalens).

## С чего начать (15 минут)

1. [ydlos-master-plan.md](ydlos-master-plan.md)
2. `overlay/packages/datalens-extensions/src/features/registry.ts`
3. `overlay/platform/upstream-rfc/`
4. `integration/publish-ui-overlay-dist.sh` — что попадает в UI-образ
5. [dostup-kontenta.md](dostup-kontenta.md) — типовой enterprise-сценарий

## Кольца

| Ring | Путь | PR? |
|------|------|-----|
| 0 | `vendor/datalens` | bump only |
| 1 | `overlay/platform` | compose/env |
| 2 | `packages/datalens-extensions` | да |
| 3 | `packages/org-private` | нет |

## В очереди upstream

- `__user_id` / `__embed` (wizard + QL)
- Share, related entities
- OIDC compose example, export limits

## Не в PR

legacy `pd_*`, Flight Groups, Organization branding, скрипты sync US под один Keycloak.

## PR

Один PR — одна тема, English, тесты, CLA. После merge — убрать patch из YDLOS.

[CONTRIBUTING_UPSTREAM.md](CONTRIBUTING_UPSTREAM.md)
