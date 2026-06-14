# Политика имён YDLOS

## Запрещено в коде и путях

| Запрет | Замена |
|--------|--------|
| `akrasnov`, `akrasnov87`, `Akrasnov` | official-нейминг |
| `akrasnov-rpc` | `legacy-rbac-compat` |
| `YDL_AKRASNOV_RPC` | `ENABLE_LEGACY_PD_RBAC` (старый env — deprecated один релиз) |
| названия IDE-ассистентов и `agent(s)` в смысле ИИ в user-facing | нейтральные формулировки |

## Разрешено

- `legacy-rbac-compat`, `legacyRbacCompat`, `ENABLE_LEGACY_PD_RBAC`
- `datalens.viewer` / `datalens.editor` / `datalens.admin` (official roles)
- Одна внешняя ссылка на исторический features.md в `OSS_EXTENDED_FEATURES.md`

## CI

```bash
bash scripts/check-banned-identifiers.sh
bash scripts/check-banned-brands.sh
```

## Классификация кастома

См. [CUSTOM_TAXONOMY.md](../CUSTOMIZATION_MANIFEST.md) — UPSTREAM / INTERIM / PRIVATE.

## Пирамида L0–L8

См. [docs/dev/kak-dobavit-rasshirenie.md](../../../docs/dev/kak-dobavit-rasshirenie.md).
