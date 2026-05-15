#!/usr/bin/env node
/**
 * Санитизация текстового pg_dump для безопасного коммита в Git.
 *
 * Режимы:
 *   --mode strict   (по умолчанию) максимум маскирования
 *   --mode standard предыдущий набор правил без части агрессивных замен
 *
 * Использование:
 *   node scripts/sanitize-pg-dump.cjs [--in file.sql] [--out file.sql] [--mode strict|standard]
 */

const fs = require('fs');

function sanitize(text, mode) {
    const strict = mode !== 'standard';
    let s = text;

    // US: Fernet cypher_text
    s = s.replace(/"cypher_text"\s*:\s*"[^"]*"/g, '"cypher_text":"<REDACTED>"');

    // URI с учётными данными
    s = s.replace(/postgres(ql)?:\/\/[^'"\s]+/gi, 'postgres://***:***@<redacted>');
    s = s.replace(/mysql:\/\/[^'"\s]+/gi, 'mysql://***:***@<redacted>');
    s = s.replace(/mssql:\/\/[^'"\s]+/gi, 'mssql://***:***@<redacted>');
    s = s.replace(/clickhouse:\/\/[^'"\s]+/gi, 'clickhouse://***:***@<redacted>');

    // Частные IPv4 в JSON host
    s = s.replace(
        /"host"\s*:\s*"(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})"/g,
        '"host":"<REDACTED_IP>"',
    );

    s = s.replace(
        /"host":"<REDACTED_IP>",([\s\S]*?"username":\s*)"[^"]*"/g,
        '"host":"<REDACTED_IP>",$1"<REDACTED>"',
    );

    // MSSQL ADO.NET / ODBC style
    s = s.replace(/Password\s*=\s*[^;'"\s][^;]*/gi, 'Password=<REDACTED>');
    s = s.replace(/Pwd\s*=\s*[^;'"\s][^;]*/gi, 'Pwd=<REDACTED>');
    s = s.replace(/User\s+ID\s*=\s*[^;'"]+/gi, 'User ID=<REDACTED>');

    // OAuth / API
    s = s.replace(/"access_token"\s*:\s*"[^"]{16,}"/g, '"access_token":"<REDACTED>"');
    s = s.replace(/"refresh_token"\s*:\s*"[^"]{16,}"/g, '"refresh_token":"<REDACTED>"');
    s = s.replace(/"secret"\s*:\s*"[^"]{8,}"/g, '"secret":"<REDACTED>"');
    s = s.replace(/"api_key"\s*:\s*"[^"]{8,}"/g, '"api_key":"<REDACTED>"');
    s = s.replace(/"client_secret"\s*:\s*"[^"]{8,}"/g, '"client_secret":"<REDACTED>"');

    // JWT-подобные строки в кавычках
    s = s.replace(/"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[^"]+"/g, '"<REDACTED_JWT>"');

    // Хэши паролей (bcrypt, argon2; в строке замены $ — спецсимвол, используем функцию)
    s = s.replace(/\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g, () => '$2$REDACTED$HASH');
    s = s.replace(/\$argon2[a-z]+\$[^'"\s,})]{16,}/gi, () => '$argon2$REDACTED');

    // AWS key id
    s = s.replace(/\bAKIA[0-9A-Z]{16}\b/g, 'AKIA_REDACTED_KEY_ID');

    if (strict) {
        // Идентификаторы подключений в метаданных датасетов (восстановление — перевязать в UI)
        s = s.replace(/"connection_id"\s*:\s*"[^"]*"/g, '"connection_id":"<REDACTED>"');

        // Подзапросы в источниках (могут содержать бизнес-логику и имена объектов)
        s = s.replace(/"subsql"\s*:\s*"[^"]*"/g, '"subsql":"<REDACTED_SQL>"');

        // Длинные db_version (утечка ОС/патчей сервера СУБД)
        s = s.replace(
            /"db_version"\s*:\s*"([^"\\]|\\.){80,}"/g,
            '"db_version":"<REDACTED_DB_VERSION>"',
        );

        // Публичные IPv4 в host (опционально скрыть инфраструктуру)
        s = s.replace(
            /"host"\s*:\s*"((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))"/g,
            (m, ip) => {
                const parts = ip.split('.').map(Number);
                const a = parts[0];
                const isPrivate =
                    a === 10 ||
                    (a === 172 && parts[1] >= 16 && parts[1] <= 31) ||
                    (a === 192 && parts[1] === 168);
                if (isPrivate) {
                    return m;
                }
                return '"host":"<REDACTED_PUBLIC_IP>"';
            },
        );

        // Email в значениях
        s = s.replace(
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
            '<REDACTED_EMAIL>',
        );
    }

    return s;
}

function main() {
    const args = process.argv.slice(2);
    let input = null;
    let output = null;
    let mode = 'strict';

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--in' && args[i + 1]) {
            input = args[++i];
        } else if (args[i] === '--out' && args[i + 1]) {
            output = args[++i];
        } else if (args[i] === '--mode' && args[i + 1]) {
            mode = args[++i];
        } else if (args[i] === '--help' || args[i] === '-h') {
            process.stderr.write(
                'Usage: node sanitize-pg-dump.cjs [--in file] [--out file] [--mode strict|standard]\n',
            );
            process.exit(0);
        }
    }

    let raw = input ? fs.readFileSync(input, 'utf8') : fs.readFileSync(0, 'utf8');
    raw = raw.replace(/^\uFEFF/, '');
    const clean = sanitize(raw, mode);

    if (output) {
        fs.writeFileSync(output, clean, 'utf8');
    } else {
        process.stdout.write(clean);
    }
}

main();
