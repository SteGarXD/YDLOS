# Очередь новых типов визуализаций (upstream)

**Workflow:** реализовать **по одному** на staging → **без PR** до проверки всего пакета → затем **отдельный PR на тип**.  
См. [docs/dev/workflow-dobavlenie-tipa-vizualizacii.md](../../../../docs/dev/workflow-dobavlenie-tipa-vizualizacii.md).

**Цель:** N типов с **полным паритетом** как у существующих (схема, preparer, export, лимиты, тесты, i18n).

**Сейчас в OSS @ uiVersion:** ~37 `WizardVisualizationId` — `bash integration/list-official-chart-types.sh`.

**Старт следующего типа:** `bash integration/chart-type-next.sh <id>`

## Шаблон одной записи (копировать на каждый тип)

```markdown
### [ ] <id> — <название>

- Репозиторий: datalens-tech/datalens-ui
- Preparer: server/modes/charts/plugins/datalens/preparers/<name>/
- HC path: gravity-charts | d3 | table
- Staging: [ ] create [ ] preview [ ] export
- PR: link
- YDLOS overlay после merge: удалить дублирующий патч
```

## Кандидаты P1 (пример — дополнять по продукту)

| id | Примечание |
|----|------------|
| funnel | часто в HC, нужен D3 path |
| waterfall | enterprise charts |
| sankey | network |
| boxplot | stats |

## Правило

1. Реализация **только** в datalens-tech (L6).
2. Staging green + `platform-acceptance` + ручной чеклист типа.
3. PR.
4. Vendor bump YDLOS — **без** дубля в overlay.

См. [docs/dev/politika-vizualizacii-hc0.md](../../../../docs/dev/politika-vizualizacii-hc0.md).

### [ ] funnel — (title)

- Staging: [ ] create [ ] preview [ ] export
- Design note: overlay/platform/design-notes/chart-funnel.md
- PR: (after full batch verified)
