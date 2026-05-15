"use strict";
/**
 * Обработчик запроса POST /export-entries
 *
 * headers:
 *  x-rpc-authorization: [Токен авторизации]
 *
 * body:
 *
{
    "links": ["3rf68dw1mhxoq", "zhdlnkugen7yn"],
    "host": "http://localhost:3030",
    "formSettings": {
        "delNumbers": null,
        "delValues": null,
        "encoding": null,
        "format": "csv"
    },
    "lang": "ru",
    "outputFormat": "xlsx",
    "exportFilename": "Опросный лист",
    "params": {
        "_d_date_start": "2024-07-01"
    }
}
 *
 * где,
 * - links: string[] - массив идентификатор chart'ов
 * - host: string - текущий хост
 * - formSettings: any - настройки, можно не менять
 * - lang: string - язык, можно не менять
 * - outputFormat: string - можно не менять
 * - exportFilename: string - суффикс имени выходного файла
 * - params: any - параметры для чартов
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportEntries = exportEntries;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const shared_1 = require("../../shared");
const moment_1 = __importDefault(require("moment"));
const path = __importStar(require("node:path"));
const child_process = __importStar(require("child_process"));
const fs = __importStar(require("node:fs"));
const TABLE_DATE_FORMAT_BY_SCALE = {
    d: 'DD.MM.YYYY',
    w: 'DD.MM.YYYY',
    m: 'MMMM YYYY',
    h: 'DD.MM.YYYY HH:mm',
    i: 'DD.MM.YYYY HH:mm',
    s: 'DD.MM.YYYY HH:mm:ss',
    q: 'YYYY',
    y: 'YYYY',
};
const tableHeadToGraphs = (head, prefix) => {
    return head.reduce((result, column) => {
        var _a, _b, _c;
        const title = (_c = (_b = (_a = column.name) !== null && _a !== void 0 ? _a : column.id) !== null && _b !== void 0 ? _b : column.type) !== null && _c !== void 0 ? _c : '';
        if (column.sub) {
            result = result.concat(tableHeadToGraphs(column.sub, prefix ? `${prefix} – ${title}` : title));
        }
        else {
            result.push({
                ...column,
                title: (prefix ? `${prefix} - ` : '') + title,
                type: column.type,
                // TODO: in theory, you need if column.type === 'date'
                scale: column.scale || 'd',
                data: [],
            });
        }
        return result;
    }, []);
};
const prepareCellValue = (cell) => {
    return Array.isArray(cell) ? prepareRowHeadersForGrid(cell) : [cell.value];
};
const prepareRowHeadersForGrid = (grid) => {
    let result = [];
    grid.forEach((level) => {
        let levelResult = [];
        level.forEach((cell) => {
            levelResult = levelResult.concat(prepareCellValue(cell));
        });
        if (result.length === 0) {
            result = levelResult;
        }
        else {
            const realResult = [];
            result.forEach((resultValue) => {
                levelResult.forEach((levelResultValue) => {
                    realResult.push(`${resultValue} — ${levelResultValue}`);
                });
            });
            result = realResult;
        }
    });
    return result;
};
const getChartData = async (host, token, links, params) => {
    let data = {};
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const axiosInstance = axios_1.default.create();
        (0, axios_retry_1.default)(axiosInstance, { retries: 3 });
        const response = await axiosInstance({
            method: 'post',
            url: `${host}/api/run`,
            headers: {
                'x-rpc-authorization': token
            },
            data: {
                "id": link,
                "params": params || {},
                "responseOptions": {
                    "includeConfig": true,
                    "includeLogs": false
                },
                "workbookId": null
            }
        });
        data[link] = response.data;
    }
    return data;
};
const prepareValues = (chartData) => {
    const { head } = chartData.data;
    const rows = chartData.data.rows || [];
    const footer = chartData.data.footer || [];
    const graphs = tableHeadToGraphs(head);
    const allTableRows = [...rows, ...footer];
    allTableRows.forEach((row, rowIndex) => {
        var _a;
        const cells = ((_a = row.values) === null || _a === void 0 ? void 0 : _a.map((value) => ({ value }))) || row.cells;
        cells.forEach((cell, index) => {
            const value = cell.grid || cell.value;
            const graph = graphs[index];
            if (typeof graph === 'undefined') {
                return;
            }
            if ((0, shared_1.isMarkupItem)(value)) {
                graph.data.push((0, shared_1.markupToRawString)(value));
            }
            else if (graph.type === 'date') {
                const dateFormat = graph.format
                    ? graph.format
                    : TABLE_DATE_FORMAT_BY_SCALE[graph.scale];
                graph.data[rowIndex] = value ? moment_1.default.utc(value).format(dateFormat) : value;
            }
            else if (graph.type === 'grid') {
                if (index === 0) {
                    const prepared = prepareRowHeadersForGrid(value);
                    graph.data = graph.data.concat(prepared);
                }
                else {
                    const prepared = value.map((cell) => cell.value);
                    graph.data = graph.data.concat(prepared);
                }
            }
            else {
                graph.data[rowIndex] = value;
            }
        });
    });
    return { graphs };
};
const stringifyData = async (host, chartData, token, settings) => {
    const params = {
        chartUrl: `/preview/editor/${chartData.id}`,
        formSettings: settings.formSettings,
        lang: settings.lang,
        // downloadConfig: props.downloadConfig,
        chartData: prepareValues(chartData),
        fullHost: "",
    };
    const stringifyData = encodeURIComponent(JSON.stringify(params));
    const request = {
        url: `${host}/api/export`,
        method: 'post',
        data: {
            data: stringifyData,
            //exportFilename: `${settings.exportFilename}` 
        },
        responseType: 'blob',
        headers: {
            'x-rpc-authorization': token
        },
    };
    const axiosInstance = axios_1.default.create();
    (0, axios_retry_1.default)(axiosInstance, { retries: 3 });
    const response = await axiosInstance(request);
    return response;
};
async function exportEntries(req, res) {
    /**
     * Конвертирует массив объектов в CSV-строку.
     * @param arr - Массив объектов с данными.
     * @returns CSV-строка.
     */
    function convertToCSV(arr, sep) {
        const headers = Object.keys(arr[0]).join(sep);
        const rows = arr.map((obj) => Object.values(obj)
            .map(value => `"${String(value).replace(/"/g, '""')}"`) // Экранирование кавычек
            .join(sep));
        return [headers, ...rows].join('\n');
    }
    var r = req;
    var host = r.body['host'] || 'http://localhost:8080';
    const ctx = req.ctx;
    if (r.body['links']) {
        // debugger
        const links = r.body['links'];
        const chartData = await getChartData(host, req.headers['x-rpc-authorization'], links, r.body['params']);
        const exportPath = path.join(__dirname, '../', '../', '../', 'export');
        const pythonScript = path.join(exportPath, 'dash2sheets.py');
        const metaPath = path.join(exportPath, 'meta.csv');
        const exportFilename = r.body['exportFilename'];
        const publicOutputPath = path.join(exportPath, `${exportFilename + '-' + Date.now()}.${r.body['outputFormat']}`);
        let metadata = [];
        const clearRegexp = /[\[\]\:\*\?\/\\]/g;
        const filteredLinks = Object.keys(chartData);
        for (let i = 0; i < filteredLinks.length; i++) {
            if (chartData[filteredLinks[i]].extra.datasets) {
                let sheetName = (chartData[filteredLinks[i]].key.split('/').length > 1 ? chartData[filteredLinks[i]].key.split('/')[1] : filteredLinks[i]) + '-' + Date.now();
                const publicOutputCSVPath = path.join(exportPath, `${sheetName.replace(clearRegexp, '_')}.${r.body['formSettings'].format}`);
                const chartProps = {};
                const chart = chartData[filteredLinks[i]];
                ["__template_name", "__sheet_name", "__mapping"].forEach(name => {
                    var _a;
                    if (((_a = chart.defaultParams[name]) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                        chartProps[String(name).replace("__", "")] = String(chart.defaultParams[name][0]);
                    }
                });
                metadata.push({
                    csv_data_name: publicOutputCSVPath,
                    ...chartProps
                });
                const response = await stringifyData(host, chartData[filteredLinks[i]], req.headers['x-rpc-authorization'], r.body);
                await fs.promises.writeFile(publicOutputCSVPath, response.data);
            }
        }
        const SEPARATOR = ";";
        const csv = convertToCSV(metadata, SEPARATOR);
        await fs.promises.writeFile(metaPath, csv, 'utf8');
        const destroy = async () => {
            if (fs.existsSync(publicOutputPath)) {
                await fs.promises.unlink(publicOutputPath);
            }
            if (fs.existsSync(metaPath)) {
                await fs.promises.unlink(metaPath);
            }
            for (let i = 0; i < metadata.length; i++) {
                if (fs.existsSync(metadata[i].csv_data_name)) {
                    await fs.promises.unlink(metadata[i].csv_data_name);
                }
            }
        };
        if (filteredLinks.length == 0) {
            res.status(404).send('Output file is empty');
            return;
        }
        // тут нужно вызвать скрипт python
        var resSpawn = child_process.spawnSync(ctx.config.python || 'python3', [pythonScript, `OUTPUT_NAME="${publicOutputPath}"`, `SEP=${SEPARATOR}`, `META_NAME="${metaPath}"`]);
        if (resSpawn != null && resSpawn.stderr.byteLength > 0) {
            ctx.logError(`Ошибка при вызове python скрипта: ${resSpawn.stderr.toString()}`);
            // ctx.logError(`EXPORT_ODS_DATA_WRITE_ERROR`, {
            //     outputPath: publicOutputPath,
            //     message: `Ошибка при вызове python скрипта: ${resSpawn.stderr.toString()}`
            // });
            res.sendStatus(500);
            await destroy();
            return;
        }
        if (fs.existsSync(publicOutputPath)) {
            res.status(200).send(await fs.promises.readFile(publicOutputPath));
        }
        else {
            res.status(404).send('Output file not found');
        }
        await destroy();
    }
    else {
        res.status(404).send('Dash ID not found');
    }
}
