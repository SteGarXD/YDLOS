-- Восстановление читаемых имён entries из bytea sort_name (UTF-8).
-- Проблема: поля name/key/display_key попали в дамп с mojibake, sort_name — корректные байты.
-- Запуск (пример): docker exec -i <postgres-container> psql -U pg-user -d pg-us-db -f fix-us-mojibake-from-sort-name.sql

BEGIN;

-- Имена объектов: взять текст из sort_name
UPDATE public.entries
SET name = convert_from(sort_name, 'UTF8')
WHERE sort_name IS NOT NULL
  AND octet_length(sort_name) > 0
  AND convert_from(sort_name, 'UTF8') IS NOT NULL
  AND name IS DISTINCT FROM convert_from(sort_name, 'UTF8');

-- display_key: только если хвост после / был mojibake (не трогаем англ. демо вроде "Sales by regions")
UPDATE public.entries
SET display_key = split_part(display_key, '/', 1) || '/' || name
WHERE display_key LIKE '%/%'
  AND split_part(display_key, '/', 1) <> ''
  AND (
      split_part(display_key, '/', 2) LIKE '%╨%'
      OR split_part(display_key, '/', 2) LIKE '%╤%'
  )
  AND display_key IS DISTINCT FROM (split_part(display_key, '/', 1) || '/' || name);

-- Воркбук Repka: описание и project_id (ручные нормальные строки; sort_title только ASCII «Repka»)
UPDATE public.workbooks
SET
    description = 'Сводная таблица',
    project_id = 'Репка'
WHERE workbook_id = 2162586614369354754
  AND title = 'Repka';

UPDATE public.collections
SET
    description = 'Сводная таблица',
    project_id = 'Репка'
WHERE title = 'Repka';

COMMIT;
