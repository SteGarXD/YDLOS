# DataLens Meta Manager

DataLens Meta Manager is a service responsible for executing long-running tasks within the DataLens ecosystem. It uses [Temporal](https://temporal.io/) workflows to manage and orchestrate operations that may take significant time to complete, such as workbook imports and exports.

## Development

### Setup

1. Clone the repository:
```bash
git clone git@github.com:datalens-tech/datalens-meta-manager.git
cd datalens-meta-manager
```

2. Install dependencies:
```bash
npm ci
```

3. Set up environment variables in `.env.development`.

4. Run in development mode:
```bash
npm run dev
```

## Запуск через vscode

Создаём launch файл
<pre>
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch via npm",
            "type": "node",
            "request": "launch",
            "cwd": "${workspaceFolder}",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"]
        }
    ]
}
</pre>

## Тестирование

В корне проекта создать файл `.env` и добавить туда строки:

<pre>
APP_INSTALLATION=opensource
APP_ENV=development

US_MASTER_TOKEN=y3nV3VncLywC4tTOuytGinbfPpfbA7Ax
EXPORT_DATA_VERIFICATION_KEY=development-export-data-verification-key

SUPPRESS_DB_STATUS_LOGS=true

US_ENDPOINT=http://host.docker.internal:8083
UI_API_ENDPOINT=http://host.docker.internal:3040
TEMPORAL_ENDPOINT=host.docker.internal:7233
POSTGRES_DSN_LIST=postgres://pg-user:tKODz7UWSUjwLKo1YupiI7rQPbStzgJw@host.docker.internal:5432/pg-meta-manager-db
AUTH_ENABLED=false
APP_PORT=3050
NODE_RPC_URL=http://host.docker.internal:8088/demo/rpc

### TEMPLATE SECRETS END
</pre>

## Сборка
<pre>
docker login -u [username]
docker build -t akrasnov87/datalens-meta-manager:0.50.0 .
docker push akrasnov87/datalens-meta-manager:0.50.0
</pre>

Для сборки так же можно вызвать команду `npm run build:image` (предварительно проверить, что для файла `build.sh` есть права на выполнение `chmod +x build.sh`)

## Получение последних изменений с главного репозитория yandex

<pre>
git remote add upstream https://github.com/datalens-tech/datalens-meta-manager.git
git pull upstream main
</pre>

## Тегирование

<pre>
git tag [версия]
git push origin [версия]
</pre>