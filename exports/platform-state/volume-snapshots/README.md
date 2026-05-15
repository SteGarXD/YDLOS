# Архив тома PostgreSQL (бинарный полный кластер)

Файлы `pgdata-*.tar.gz` создаёт `scripts/archive-postgres-data-volume-for-git.ps1`.

- По умолчанию маскируются в **`.gitignore`** (большой размер, бинарник).
- Чтобы версионировать в Git: включите [Git LFS](https://git-lfs.com/) в репозитории, затем удалите соответствующую строку из корневого `.gitignore` и добавьте в корень `.gitattributes`:

```gitattributes
exports/platform-state/volume-snapshots/pgdata-*.tar.gz filter=lfs diff=lfs merge=lfs -text
```

- Контрольная сумма и путь к последнему архиву — в `sanitized/VOLUME_ARCHIVE.json` (этот JSON **коммитится** при экспорте).
