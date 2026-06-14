# Workflow: новый тип визуализации (как инженер datalens-tech)

**Правило:** один тип → staging → зелёный чеклист → следующий тип. **PR — только после** всех типов пакета проверены.

## Фазы

### Фаза A — Реализация в YDLOS (без PR)

1. Design note: `overlay/platform/design-notes/chart-<id>.md` (шаблон `_TEMPLATE.md`).
2. Код в стиле vendor: `preparers/<type>/`, тесты, i18n keysets — **копировать паттерн** соседнего типа (например `pie/`).
3. Регистрация: `WizardVisualizationId`, wizard UI, gravity/d3 path при `HC=0`.
4. Сборка: `npm run build` в overlay UI → `publish-ui-overlay-dist.sh`.
5. Staging deploy + **ручной чеклист** (создать, preview, export, лимиты).
6. Запись в `CHART_UPSTREAM_QUEUE.md`: статус `staging-ok`.
7. **Не открывать PR** до фазы C.

### Фаза B — Следующий тип

Повторить A для типа N+1.

### Фаза C — PR (после всего пакета)

Для **каждого** типа со статусом `staging-ok`:

1. Минимизировать diff под upstream (один concern).
2. `bash integration/upstream-prepare-pr.sh`
3. PR в `datalens-tech/datalens-ui` — **английский** description, тесты, скриншоты.
4. После merge upstream — vendor bump YDLOS, **удалить** дубль из overlay.

## Команды

```bash
bash integration/chart-type-next.sh funnel    # создать design-note из шаблона
bash integration/list-official-chart-types.sh
HC=0 bash integration/smoke-chart-types-hc0.sh
```

## Чеклист одного типа (staging)

- [ ] Тип в мастере чартов при HC=0
- [ ] Preview без ошибок
- [ ] Export (если применимо)
- [ ] i18n ru/en
- [ ] Unit test preparer
- [ ] Нет регрессии соседних типов

См. [politika-vizualizacii-hc0.md](politika-vizualizacii-hc0.md), [CONTRIBUTING_UPSTREAM.md](CONTRIBUTING_UPSTREAM.md).
