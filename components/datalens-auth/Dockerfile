# Образ с registry уже содержит node_modules (зависимости с git.mobwal.com).
# Полная пересборка app из исходников без доступа к git.mobwal.com невозможна — только патч поверх базового слоя.
# Дайджест привязан к akrasnov87/datalens-auth:0.2.6 на Docker Hub; при смене базового тега обновите digest (`docker inspect ... --format '{{index .RepoDigests 0}}'`).
FROM akrasnov87/datalens-auth@sha256:2dbea1babcbf4e302e4b921db967d7dd68894020a0a0d4f8a9fac4cba019ccd6

LABEL desc="datalens-auth YDL-OS: /demo/refresh + datalens-auth routes"

USER root
COPY app/app.js /app/app.js
COPY app/routes/datalens-auth.js /app/routes/datalens-auth.js
RUN chown dl:dl /app/app.js /app/routes/datalens-auth.js && chmod 644 /app/app.js /app/routes/datalens-auth.js

USER dl
