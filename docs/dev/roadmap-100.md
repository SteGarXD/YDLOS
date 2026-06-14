# Roadmap 100% YDLOS

**Мастер-план TOP-1 v2 (фазы 0–15):** [ydlos-master-plan.md](ydlos-master-plan.md) · **Портал OIDC/RLS:** [scenariy-portal-oidc-us-rls.md](scenariy-portal-oidc-us-rls.md) · **Каталог A–K:** [cloud-features-catalog-for-decision.md](cloud-features-catalog-for-decision.md).

Порядок работ (PR в datalens-tech **только после** пунктов 1–5).

| Шаг | Задача | Критерий готовности | Статус |
|-----|--------|---------------------|--------|
| 1 | UI rebase @ uiVersion | `package.json` = vendor; отчёт `ui-rebase-*.txt`; build OK | **Анализ:** 111 YDL-only, 784 modified vs upstream 0.3831.0 |
| 2 | Полный overlay-inventory | `generate-overlay-inventory.sh`; каждый ключевой модуль | В работе |
| 3 | Feature registry + acceptance | `feature-registry.md`; `platform-acceptance.sh` green | В работе |
| 4 | Merge `feature/us-auth-official-1.39` → `main` | main = official stack + docs | Ожидает |
| 5 | Prod/staging QA | acceptance + reader E2E + governance OK | Ожидает |
| 6 | Фаза E: upstream PR | по `upstream-pr-queue.md` | После шага 5 |

## Команды

```bash
# Анализ rebase UI (без замены дерева)
bash integration/rebase-ui-from-upstream.sh

# Замена дерева + ручной port (осторожно)
bash integration/rebase-ui-from-upstream.sh 0.3831.0 --execute

bash integration/generate-overlay-inventory.sh
bash integration/publish-ui-overlay-dist.sh
bash integration/platform-acceptance.sh
bash integration/production-ready-100.sh   # полный gate на хосте с Docker
```

## Не входит в «100% за одну итерацию»

- Принятие PR в datalens-tech (внешний цикл)
- Все 50+ пунктов P2 мега-бэклога без upstream merge
- «Ноль строк overlay» — цель после серии PR, не сейчас
