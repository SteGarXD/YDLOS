-- Триггеры US (workbooks/entries/collections) вызывают naturalsort(text).
-- Если функции нет (чистый volume / сбой миграций), восстановление из дампа падает.
-- Источник: datalens-us db/migrations/20190718112426_naturalsort_name.ts
CREATE OR REPLACE FUNCTION public.naturalsort(text) RETURNS bytea AS $$
    SELECT string_agg(
        convert_to(
            coalesce(
                r[2],
                length(length(r[1])::text) || length(r[1])::text || r[1]
            ),
            'UTF8'
        ),
        decode('00', 'hex')
    ) from regexp_matches(
        regexp_replace(
            regexp_replace($1, 'ё', 'е', 'g'),
            '_', '!', 'g'
        ),
        '0*([0-9]+)|([^0-9]+)', 'g'
    ) r;
$$ LANGUAGE sql IMMUTABLE STRICT;
