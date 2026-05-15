Docker full backup (2026-03-23_21-48-27)
========================
APP_ENV: prod
Postgres volume name: datalens-volume-prod

Contents:
- compose.effective.yaml
- docker-ps-a.txt, docker-images.txt, docker-volumes-ls.txt
- pg_dumpall.sql (full cluster logical dump)
- pg-us-db.dump or pg-us-db.sql (United Storage)
- pgdata.tar.gz (raw postgres data volume)

Restore: see DOCKER-BACKUP.md in datalens folder.
Do not commit secrets; store backups securely.
