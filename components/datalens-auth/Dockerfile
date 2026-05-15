# Базовый образ уже содержит node_modules (зависимости с git.mobwal.com).
# Полная пересборка app из исходников без доступа к git.mobwal.com невозможна — только патч поверх базового слоя.
# Для регулярной актуализации безопасности используем tag + docker build --pull в redeploy-цикле.
ARG DATALENS_AUTH_BASE_IMAGE=akrasnov87/datalens-auth:0.2.6
FROM ${DATALENS_AUTH_BASE_IMAGE}

LABEL desc="datalens-auth YDL-OS: /demo/refresh + datalens-auth routes"

USER root
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get -y upgrade && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
COPY app/app.js /app/app.js
COPY app/routes/datalens-auth.js /app/routes/datalens-auth.js
RUN chown dl:dl /app/app.js /app/routes/datalens-auth.js && chmod 644 /app/app.js /app/routes/datalens-auth.js

USER dl
