/**
 * REST API для «Редактор групп рейсов» (AZ_FLIGHTS_GROUPS, AZ_FLIGHTSinGROUPS).
 *
 * Обязательно для записи/чтения: `FLIGHT_GROUPS_MSSQL_CONNECTION_STRING` (строка подключения node-mssql).
 *
 * Видимость кнопки на дашборде (клиент): `FLIGHT_GROUPS_EDITOR_DATASET_IDS` — через запятую entry id датасетов
 * (для варианта 3 обычно достаточно одного id “единого” VIEW/датасета); пусто — кнопка скрыта.
 *
 * Правая колонка «Рейсы не в группе»: `FLIGHT_GROUPS_MASTER_FLIGHTS_SQL` — SQL, возвращающий столбец `flightNo`
 * (подзапрос в скобках); иначе используется `SELECT DISTINCT flightNo FROM AZ_FLIGHTSinGROUPS`.
 *
 * Защита служебных групп: `FLIGHT_GROUPS_PROTECTED_GROUP_IDS` (по умолчанию `1` для ALL).
 * Имена таблиц: `FLIGHT_GROUPS_TABLE_GROUPS`, `FLIGHT_GROUPS_TABLE_MEMBERS`.
 * Опционально: `FLIGHT_GROUPS_EDITOR_TOKEN` — заголовок `x-flight-groups-editor-token` на запросах API.
 */
import type {Request, Response} from '@gravity-ui/expresskit';
import sql from 'mssql';

/* eslint-disable new-cap -- mssql driver: sql.NVarChar, sql.Int */
const GROUPS_TABLE = process.env.FLIGHT_GROUPS_TABLE_GROUPS || 'AZ_FLIGHTS_GROUPS';
const MEMBERS_TABLE = process.env.FLIGHT_GROUPS_TABLE_MEMBERS || 'AZ_FLIGHTSinGROUPS';
const PROTECTED_GROUP_IDS = (process.env.FLIGHT_GROUPS_PROTECTED_GROUP_IDS || '1')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getPool(): Promise<sql.ConnectionPool> | null {
    const conn = process.env.FLIGHT_GROUPS_MSSQL_CONNECTION_STRING;
    if (!conn) {
        return null;
    }
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(conn).connect().catch((e: unknown) => {
            poolPromise = null;
            throw e;
        });
    }
    return poolPromise;
}

function checkEditorToken(req: Request, res: Response): boolean {
    const expected = process.env.FLIGHT_GROUPS_EDITOR_TOKEN;
    if (!expected) {
        return true;
    }
    const got = req.headers['x-flight-groups-editor-token'];
    const ok = typeof got === 'string' && got === expected;
    if (!ok) {
        res.status(403).json({error: 'Forbidden'});
    }
    return ok;
}

function dbNotConfigured(res: Response) {
    res.status(503).json({
        error: 'Flight groups database is not configured (set FLIGHT_GROUPS_MSSQL_CONNECTION_STRING)',
    });
}

function isProtectedGroupId(id: number) {
    return PROTECTED_GROUP_IDS.includes(id);
}

export async function flightGroupsEditorConfig(_req: Request, res: Response) {
    const raw = process.env.FLIGHT_GROUPS_EDITOR_DATASET_IDS || '';
    const datasetIds = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    res.status(200).json({datasetIds});
}

export async function flightGroupsEditorGroupsList(_req: Request, res: Response) {
    if (!checkEditorToken(_req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    try {
        const r = await pool;
        const result = await r.query(
            `SELECT id, groupName FROM ${GROUPS_TABLE} ORDER BY groupName`,
        );
        res.status(200).json({groups: result.recordset});
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorGroupCreate(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const groupName = String((req.body as {groupName?: string})?.groupName || '').trim();
    if (!groupName) {
        res.status(400).json({error: 'groupName required'});
        return;
    }
    try {
        const r = await pool;
        const request = r.request();
        request.input('groupName', sql.NVarChar(500), groupName);
        const ins = await request.query(
            `INSERT INTO ${GROUPS_TABLE} (groupName) OUTPUT INSERTED.id AS id VALUES (@groupName)`,
        );
        const id = ins.recordset[0]?.id;
        res.status(201).json({id});
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorGroupUpdate(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const id = parseInt(req.params.id || '', 10);
    const groupName = String((req.body as {groupName?: string})?.groupName || '').trim();
    if (!groupName || Number.isNaN(id)) {
        res.status(400).json({error: 'invalid id or groupName'});
        return;
    }
    if (isProtectedGroupId(id)) {
        res.status(403).json({error: 'Cannot rename protected group'});
        return;
    }
    try {
        const r = await pool;
        const request = r.request();
        request.input('id', sql.Int, id);
        request.input('groupName', sql.NVarChar(500), groupName);
        await request.query(`UPDATE ${GROUPS_TABLE} SET groupName = @groupName WHERE id = @id`);
        res.status(204).end();
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorGroupDelete(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const id = parseInt(req.params.id || '', 10);
    if (Number.isNaN(id)) {
        res.status(400).json({error: 'invalid id'});
        return;
    }
    if (isProtectedGroupId(id)) {
        res.status(403).json({error: 'Cannot delete protected group'});
        return;
    }
    try {
        const r = await pool;
        const rq1 = r.request();
        rq1.input('id', sql.Int, id);
        await rq1.query(`DELETE FROM ${MEMBERS_TABLE} WHERE groupID = @id`);
        const rq2 = r.request();
        rq2.input('id', sql.Int, id);
        await rq2.query(`DELETE FROM ${GROUPS_TABLE} WHERE id = @id`);
        res.status(204).end();
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

function escapeLike(s: string) {
    return s.replace(/[%_[]/g, (ch) => `[${ch}]`);
}

export async function flightGroupsEditorFlightsIn(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const groupId = parseInt(req.params.groupId || '', 10);
    const filter = String(req.query.filter || '').trim();
    if (Number.isNaN(groupId)) {
        res.status(400).json({error: 'invalid groupId'});
        return;
    }
    try {
        const r = await pool;
        const request = r.request();
        request.input('groupId', sql.Int, groupId);
        let q = `SELECT flightNo FROM ${MEMBERS_TABLE} WHERE groupID = @groupId`;
        if (filter) {
            request.input('flt', sql.NVarChar(200), `%${escapeLike(filter)}%`);
            q += ` AND flightNo LIKE @flt`;
        }
        q += ` ORDER BY flightNo`;
        const result = await request.query(q);
        res.status(200).json({
            flights: result.recordset.map((row: {flightNo: string}) => row.flightNo),
        });
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorFlightsOut(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const groupId = parseInt(req.params.groupId || '', 10);
    const filter = String(req.query.filter || '').trim();
    if (Number.isNaN(groupId)) {
        res.status(400).json({error: 'invalid groupId'});
        return;
    }
    const masterSql =
        process.env.FLIGHT_GROUPS_MASTER_FLIGHTS_SQL ||
        `SELECT DISTINCT flightNo FROM ${MEMBERS_TABLE}`;
    try {
        const r = await pool;
        const request = r.request();
        request.input('groupId', sql.Int, groupId);
        let q = `SELECT M.flightNo FROM (${masterSql}) AS M
            WHERE NOT EXISTS (
                SELECT 1 FROM ${MEMBERS_TABLE} G WHERE G.groupID = @groupId AND G.flightNo = M.flightNo
            )`;
        if (filter) {
            request.input('flt', sql.NVarChar(200), `%${escapeLike(filter)}%`);
            q += ` AND M.flightNo LIKE @flt`;
        }
        q += ` ORDER BY M.flightNo`;
        const result = await request.query(q);
        res.status(200).json({
            flights: result.recordset.map((row: {flightNo: string}) => row.flightNo),
        });
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorFlightAdd(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const groupId = parseInt(req.params.groupId || '', 10);
    const flightNo = String((req.body as {flightNo?: string})?.flightNo || '').trim();
    if (Number.isNaN(groupId) || !flightNo) {
        res.status(400).json({error: 'invalid groupId or flightNo'});
        return;
    }
    try {
        const r = await pool;
        const request = r.request();
        request.input('groupId', sql.Int, groupId);
        request.input('flightNo', sql.NVarChar(100), flightNo);
        await request.query(
            `INSERT INTO ${MEMBERS_TABLE} (flightNo, groupID) VALUES (@flightNo, @groupId)`,
        );
        res.status(201).end();
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}

export async function flightGroupsEditorFlightRemove(req: Request, res: Response) {
    if (!checkEditorToken(req, res)) {
        return;
    }
    const pool = getPool();
    if (!pool) {
        dbNotConfigured(res);
        return;
    }
    const groupId = parseInt(req.params.groupId || '', 10);
    const flightNo = String(req.params.flightNo || '').trim();
    if (Number.isNaN(groupId) || !flightNo) {
        res.status(400).json({error: 'invalid groupId or flightNo'});
        return;
    }
    try {
        const r = await pool;
        const request = r.request();
        request.input('groupId', sql.Int, groupId);
        request.input('flightNo', sql.NVarChar(100), flightNo);
        await request.query(
            `DELETE FROM ${MEMBERS_TABLE} WHERE groupID = @groupId AND flightNo = @flightNo`,
        );
        res.status(204).end();
    } catch (e) {
        res.status(500).json({error: String(e)});
    }
}
