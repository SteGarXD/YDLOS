# Политика: визуализации и HC=0

## Что даёт `HC=0` (честно)

- Отключается Highcharts; для типов из **каталога DataLens OSS** используются **Gravity Charts / D3 / preparers**, уже зарегистрированные в `datalens-ui`.
- **Не** подключает «все библиотеки визуализаций мира» и **не** добавляет 100 новых пунктов в мастер чартов автоматически.

Список ID в wizard: `overlay/components/datalens-ui/src/shared/constants/visualization.ts` (`WizardVisualizationId`).

Сгенерировать актуальный список:

```bash
bash integration/list-official-chart-types.sh
```

## Workflow (ваш процесс)

1. Один тип → staging OK → следующий тип (**без PR**).
2. После всего пакета — **отдельный PR на каждый тип** в datalens-tech.

Подробно: [workflow-dobavlenie-tipa-vizualizacii.md](workflow-dobavlenie-tipa-vizualizacii.md).

## Цель «100 типов с полным паритетом»

Каждый новый тип как у upstream должен иметь:

| Компонент | Где в datalens-tech |
|-----------|---------------------|
| ID в wizard | `WizardVisualizationId` + UI wizard |
| Схема / config | `shared/modules/config/wizard/` |
| Preparer | `server/modes/charts/plugins/datalens/preparers/` |
| Экспорт | export helpers + feature flags |
| Лимиты | env / docs limits |
| Тесты | `preparers/**/__tests__`, opensource-suites |
| i18n | keysets |

**Путь:** один тип = один **PR в datalens-tech** после staging. Очередь: [CHART_UPSTREAM_QUEUE.md](../../overlay/packages/datalens-extensions/charts/CHART_UPSTREAM_QUEUE.md).

## YDLOS CONFIG (без новых типов в overlay)

```bash
HC=0
# опционально Gravity Charts flags — см. vendor Feature.*
bash integration/enable-all-bi-features.sh overlay/platform/.env
```

Smoke HC=0:

```bash
HC=0 bash integration/smoke-chart-types-hc0.sh
```

## Запрещено

- Обещать пользователям «все графики мира» через один env.
- Добавлять тип чарта только в overlay без upstream-регистрации (кроме PRIVATE L8 с RFC).
