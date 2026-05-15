"use strict";
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
exports.csvConverter = csvConverter;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process = __importStar(require("child_process"));
const perf_hooks_1 = require("perf_hooks");
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const moment_1 = __importDefault(require("moment/moment"));
const DAY_MS = 1000 * 60 * 60 * 24;
const CSV_DATA_LIMIT = 1024 * 1024 * 50; // 50MB
function csvConverter(req, res, chartData, dataArray, formSettings, downloadConfig) {
    const { ctx } = req;
    ctx.log('EXPORT_CSV');
    const reqDataLength = req.body.data.length;
    const monitorHistogram = (0, perf_hooks_1.monitorEventLoopDelay)();
    if (reqDataLength > CSV_DATA_LIMIT) {
        ctx.logError(`EXPORT_CSV_DATA_LIMIT_ERROR`, {
            bytes: reqDataLength,
        });
        req.ctx.stats('exportSizeStats', {
            datetime: Date.now(),
            exportType: 'csv',
            sizeBytes: reqDataLength,
            timings: 0,
            rejected: 'true',
        });
        res.sendStatus(413);
        return;
    }
    const csvStart = perf_hooks_1.performance.now();
    monitorHistogram.enable();
    res.setHeader('Content-disposition', `attachment; filename=${downloadConfig.filename}.csv`);
    res.setHeader('Content-type', 'text/csv');
    if (formSettings.delValues === 'tab') {
        formSettings.delValues = '\t';
    }
    if (formSettings.delValues === 'space') {
        formSettings.delValues = ' ';
    }
    const delValues = formSettings.delValues || ';';
    let lines = [];
    const header = [];
    if (chartData.categories_ms) {
        header.push('"DateTime"');
    }
    if (chartData.categories) {
        header.push('"Categories"');
    }
    chartData.graphs.forEach((graph) => {
        header.push(`"${graph.title}"`);
    });
    lines.push(header);
    ctx.log('EXPORT_CSV_START_PREPARING');
    dataArray.forEach((item, i) => {
        const line = [];
        if (item) {
            const diff = item - dataArray[i - 1] || dataArray[i + 1] - item;
            const format = diff < DAY_MS ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
            const measure = chartData.categories_ms ? (0, moment_1.default)(item).format(format) : item;
            line.push(`"${measure}"`);
        }
        chartData.graphs.forEach((graph) => {
            let currentValue = graph.data[i];
            let value = '""';
            if (currentValue || currentValue === 0) {
                if (graph.type === 'diff' && Array.isArray(currentValue)) {
                    currentValue = currentValue[0];
                }
                value = String(currentValue);
                if (typeof currentValue === 'number') {
                    value = value.replace('.', formSettings.delNumbers || ',');
                    if (value.includes(delValues)) {
                        value = `"${value}"`;
                    }
                }
                else if (typeof currentValue === 'string') {
                    value = `"${value.replace(/"/g, '""')}"`;
                }
            }
            line.push(value);
        });
        lines.push(line);
    });
    lines = lines.map((line) => {
        return line.join(delValues);
    });
    let csvContent = lines.join('\n');
    if (formSettings.encoding === 'cp1251') {
        csvContent = iconv_lite_1.default.encode(csvContent, 'win1251');
    }
    if (formSettings.format === 'ods') {
        const exportPath = path.join(__dirname, '../', '../', '../', '../', '../', 'export');
        const pythonScript = path.join(exportPath, 'csv2ods.py');
        const publicOutputCsvPath = path.join(exportPath, `${downloadConfig.filename}.csv`);
        const publicOutputOdsPath = path.join(exportPath, `${downloadConfig.filename}.ods`);
        const context = req.ctx;
        var err = fs.writeFileSync(publicOutputCsvPath, csvContent.toString());
        if (err != null) {
            ctx.logError(`EXPORT_ODS_DATA_WRITE_ERROR`, {
                outputPath: publicOutputCsvPath,
                message: `Ошибка сохранения файла CSV: ${err}`
            });
            req.ctx.stats('exportSizeStats', {
                datetime: Date.now(),
                exportType: 'ods',
                sizeBytes: reqDataLength,
                timings: 0,
                rejected: 'true',
            });
            res.sendStatus(500);
            fs.unlinkSync(publicOutputCsvPath);
            return;
        }
        // тут нужно вызвать скрипт python
        var resSpawn = child_process.spawnSync(context.config.python || 'python3', [pythonScript, `FILE_PATH="${publicOutputCsvPath}"`]);
        if (resSpawn != null && resSpawn.stderr.byteLength > 0) {
            ctx.logError(`EXPORT_ODS_DATA_WRITE_ERROR`, {
                outputPath: publicOutputCsvPath,
                message: `Ошибка при вызове python скрипта: ${resSpawn.stderr.toString()}`
            });
            req.ctx.stats('exportSizeStats', {
                datetime: Date.now(),
                exportType: 'ods',
                sizeBytes: reqDataLength,
                timings: 0,
                rejected: 'true',
            });
            res.sendStatus(500);
            fs.unlinkSync(publicOutputCsvPath);
            return;
        }
        ctx.log('EXPORT_ODS_FINISH_PREPARING');
        const csvStop = perf_hooks_1.performance.now();
        monitorHistogram.disable();
        req.ctx.stats('exportSizeStats', {
            datetime: Date.now(),
            exportType: 'ods',
            sizeBytes: reqDataLength,
            timings: csvStop - csvStart,
            rejected: 'false',
            requestId: req.id,
            eventLoopDelay: monitorHistogram.max / 1000000,
        });
        res.status(200).send(fs.readFileSync(publicOutputOdsPath));
        fs.unlinkSync(publicOutputCsvPath);
        fs.unlinkSync(publicOutputOdsPath);
        return;
    }
    ctx.log('EXPORT_CSV_FINISH_PREPARING');
    const csvStop = perf_hooks_1.performance.now();
    monitorHistogram.disable();
    req.ctx.stats('exportSizeStats', {
        datetime: Date.now(),
        exportType: 'csv',
        sizeBytes: reqDataLength,
        timings: csvStop - csvStart,
        rejected: 'false',
        requestId: req.id,
        eventLoopDelay: monitorHistogram.max / 1000000,
    });
    res.status(200).send(csvContent);
}
