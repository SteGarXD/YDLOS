# RFC 001: QL chart parameters `__user_id` and `__embed`

**Уровень:** L6 — PR в datalens-tech/datalens-ui  
**Статус:** реализовано в YDLOS overlay; кандидат upstream

## Проблема

Self-hosted нужны системные параметры в QL-SQL для RLS и embed-контекста (akrasnov87 features.md §7).

## Предложение

Документировать и прокидывать в charts-engine `run.ts` как official chart params (не отдельный RPC).

## YDLOS

`overlay/components/datalens-ui/src/server/components/charts-engine/controllers/run.ts`

## Критерии приёмки upstream

- Параметры в UI QL editor + docs RU/EN
- Тест в opensource-suites
