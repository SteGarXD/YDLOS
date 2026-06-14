# Дорожная карта

**Полный мастер-план «Monster BI / TOP-1» (фазы 0–15):** [dev/ydlos-master-plan.md](dev/ydlos-master-plan.md).

**Для кого:** бизнес и ИТ.

## Позиционирование

**Суверенная BI на DataLens OSS** для организаций в РФ: данные у заказчика, русская документация, корпоративный SSO, отраслевые решения (авиация).

## Дифференциаторы vs «голый» OSS

1. RU-документация по IA official DataLens.
2. On-prem лимиты и экспорт (Excel) под тяжёлые дашборды.
3. Отраслевой слой Аэронавигатор (дашборды, flight-groups).

## KPI (12 месяцев)

| KPI | Цель |
|-----|------|
| Время vendor bump на staging | &lt; 1 рабочий день |
| Строки overlay Ring 2 | −50% |
| PR отправлено в datalens-tech | ≥ 3 (P0) |
| PR принято | ≥ 1 |
| Uptime prod BI | по внутреннему SLA |
| Аналитик: вход → дашборд без инженера | по RU docs |

## Фазы

| Фаза | Содержание |
|------|------------|
| A | Docs RU, governance, runtime |
| B | Rebase UI, overlay audit, extensions |
| C | Official RBAC, выключить legacy bridge |
| D | Бизнес Аэронавигатор (PRIVATE) |
| E | PR upstream |

## Глобально

Вклад в [datalens-tech/datalens](https://github.com/datalens-tech/datalens) — репутация и меньше форка.

**Амбиция v2:** лучший OSS BI-дистрибутив (см. [ydlos-master-plan.md](dev/ydlos-master-plan.md)) — v1 Portal → v2 Enterprise → v3 Monster; честный горизонт 3–5 лет, не «всё за год».
