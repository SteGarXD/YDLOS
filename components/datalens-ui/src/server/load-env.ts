/**
 * Загрузка `.env` до любых других модулей сервера.
 * `dotenv/config` ищет только `process.cwd()/.env` — при запуске из корня монорепо или из `dist/server`
 * cwd может быть «не там», и APP_INSTALLATION/US_MASTER_TOKEN не попадают в process.env.
 */
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

const candidates = [
    path.resolve(process.cwd(), '.env'),
    // dist/server/*.js → ../../.env = корень пакета datalens-ui
    path.join(__dirname, '..', '..', '.env'),
    path.join(__dirname, '..', '.env'),
];

for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
        dotenv.config({path: envPath});
        break;
    }
}
