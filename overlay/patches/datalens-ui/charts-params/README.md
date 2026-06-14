# charts-params (minimal)

После 2026-06 из overlay убрана вся org-workbooks-логика параметров (`charts-shared.ts` с `expandorg-workbooksDateParamAliases`, `sanitizeChartRequestParamsForApi`, …).

Остаётся только **`flat-table-row-tree-state.ts`** для `client-viz-corp` (дерево строк таблицы).

Параметры датасетов и `/api/run` — **только upstream DataLens**.
