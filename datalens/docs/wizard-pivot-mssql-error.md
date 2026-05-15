# Ошибка загрузки данных при сводной таблице (Wizard) по датасету MSSQL

## Симптом

- Датасет на источнике MSSQL (например, функция `[dbo].[fnAZ_Rep_MainW]`) **без параметров** возвращает данные — превью датасета работает.
- При создании **сводной таблицы** (Wizard → «Сводная таблица») по этому датасету появляется **«Ошибка загрузки данных»**.
- В отладочной информации: `ERR.DS_API.DB`, `sourceType: "bi_datasets"`, в `details.db_message` — ошибка SQL Server:

```text
[42000] [FreeTDS] [SQL Server] The text, ntext, and image data types cannot be compared or sorted, except when using IS NULL or LIKE operator. (306)
```

## Причина

Запрос для чарта по датасету строит **бэкенд** (data-api). Для сводной он генерирует SQL с `GROUP BY` и `ORDER BY` по полям измерений (например `dt`, `wd`, `nr_s`, `mrshr`).

В SQL Server типы **text**, **ntext** и **image** нельзя использовать в сравнениях и сортировке — в том числе в `GROUP BY` и `ORDER BY`. Если источник возвращает такие колонки, запрос падает.

## Исправление в DataLens (патч data-api)

В этом проекте включён **патч** для контейнера data-api: выражения в `GROUP BY` и `ORDER BY` для MSSQL оборачиваются в `CAST(... AS NVARCHAR(4000))`, поэтому колонки типа text/ntext перестают вызывать ошибку.

- **Файл патча:** `datalens/patches/data-api-mssql/query_compiler.py`
- **Монтирование:** в `docker-compose.yaml` у сервиса `data-api` задан volume, подменяющий  
  `dl_connector_mssql/core/query_compiler.py` внутри контейнера этим файлом.

После перезапуска data-api (`docker compose restart data-api`) сводная по датасету «Репка» (и другим MSSQL-источникам с text/ntext) должна загружаться без ошибки.

**Ограничение:** все поля измерений в GROUP BY/ORDER BY приводятся к NVARCHAR(4000). Если среди них есть числа или даты, сортировка может быть лексикографической; для типичных строковых полей (wd, nr_s, mrshr) поведение корректно.
