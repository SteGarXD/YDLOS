# Vendor submodule и история корня репозитория

## Два разных «отставания»

| Что сравнивается | Норма для YDLOS |
|------------------|-----------------|
| **`vendor/datalens`** vs `datalens-tech/datalens:main` | **behind=0** — обязательно для prod |
| **Корень YDLOS** vs `datalens-tech/datalens:main` | Может расходиться — YDLOS не клон monorepo, а дистрибутив |

```bash
bash integration/check-version-alignment.sh
```

## Репозиторий не fork

YDLOS — **отдельный** репозиторий (vendor submodule + overlay). Связь с official только через:

```bash
bash integration/update-vendor.sh main
```

Не используйте **Sync fork** на GitHub — это для fork-сети datalens monorepo.

## Если раньше был fork

После **Leave fork network** баннер «X behind / Y ahead» пропадает.  
`vendor/datalens` по-прежнему обновляется через `update-vendor.sh`.
