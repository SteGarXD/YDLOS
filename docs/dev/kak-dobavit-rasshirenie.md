# Как добавить расширение

**Для кого:** разработчики.

## Пирамида L0–L8 (обязательный порядок)

| Уровень | Действие |
|---------|----------|
| L0 | Уже есть в vendor — не писать код |
| L1 | Только `env` / compose |
| L2 | «Настройки сервиса» |
| L3 | Параметры датасета/дашборда |
| L4 | US permissions / share |
| L5 | `registerAppPlugins` (минимум) |
| L6 | PR в datalens-tech (новый env/setting) |
| L7 | INTERIM server hook — с дедлайном |
| L8 | `org-private/*` — только корпоративное |

## Перед кодом

1. Design note: `overlay/platform/design-notes/<feature>.md`
2. Запись в `overlay/platform/docs/overlay-inventory.md`
3. Метка UPSTREAM / INTERIM / PRIVATE

## Запрещено

- Правки в `vendor/datalens`
- Новый RPC без RFC
- Идентификаторы из [NAMING_POLICY.md](../../overlay/platform/docs/NAMING_POLICY.md)

## После merge upstream

Удалить соответствующий модуль из overlay; обновить inventory.
