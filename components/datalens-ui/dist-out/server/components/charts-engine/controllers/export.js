"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportController = void 0;
const moment_1 = __importDefault(require("moment"));
const registry_1 = require("../../../registry");
const csvConverter_1 = require("./csvConverter");
const DATA_LIMIT = 1024 * 1024 * 100; // 100MB
const exportController = () => {
    return async (req, res) => {
        const { ctx } = req;
        ctx.log('EXPORT_START');
        const reqDataLength = req.body.data.length;
        if (reqDataLength > DATA_LIMIT) {
            ctx.logError(`EXPORT_DATA_LIMIT_ERROR`, {
                bytes: reqDataLength,
            });
            req.ctx.stats('exportSizeStats', {
                datetime: Date.now(),
                exportType: 'unknown',
                sizeBytes: reqDataLength,
                timings: 0,
                rejected: 'true',
                requestId: req.id,
            });
            res.sendStatus(413);
            return;
        }
        let POST;
        try {
            POST = JSON.parse(decodeURIComponent(req.body.data.replace(/\+/g, ' ')));
        }
        catch (e) {
            res.sendStatus(400);
            return;
        }
        ctx.log('EXPORT_BODY_DATA_PARSED');
        const chartData = POST.chartData;
        const dataArray = chartData.categories_ms ||
            chartData.categories_ms ||
            chartData.categories ||
            (chartData.graphs && Array(chartData.graphs[0].data.length).fill(undefined));
        if (!Array.isArray(dataArray)) {
            ctx.log(`Unsupported format`);
            res.sendStatus(400);
            return;
        }
        const dataArrayLength = dataArray && dataArray.length;
        ctx.log('EXPORT_DATA_ARRAY_LENGTH', {
            length: dataArrayLength,
        });
        const downloadConfig = POST.downloadConfig || {
            filename: 'ChartExportData',
        };
        downloadConfig.filename += `_${(0, moment_1.default)().format('YYYY_MM_DD_HH_mm')}`;
        if (POST.formSettings.format === 'csv') {
            (0, csvConverter_1.csvConverter)(req, res, chartData, dataArray, POST.formSettings, downloadConfig);
        }
        else if (POST.formSettings.format === 'ods') {
            (0, csvConverter_1.csvConverter)(req, res, chartData, dataArray, POST.formSettings, downloadConfig);
        }
        else if (POST.formSettings.format === 'xlsx') {
            const xlsxConverter = registry_1.registry.getXlsxConverter();
            if (xlsxConverter !== undefined) {
                xlsxConverter(req, res, chartData, dataArray, downloadConfig);
            }
        }
        else {
            ctx.log(`Unsupported format`);
            res.sendStatus(400);
        }
    };
};
exports.exportController = exportController;
