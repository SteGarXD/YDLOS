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
exports.xlsxConverter = xlsxConverter;
const fs_1 = __importDefault(require("fs"));
const promises_1 = require("fs/promises");
const xlsx_1 = __importDefault(require("@datalens-tech/xlsx"));
const date_utils_1 = require("@gravity-ui/date-utils");
const lodash_1 = require("lodash");
const mime_1 = __importDefault(require("mime"));
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const XLS_DATA_LIMIT = 1024 * 1024 * 50; // 50MB
const MAX_EXCEL_CELL_LENGTH = 32767;
function isCell(cellData) {
    return (0, lodash_1.isObject)(cellData) && 't' in cellData && 'v' in cellData;
}
const getWorkSheet = (widgetKey) => {
    var _a;
    const defaultSheet = xlsx_1.default.utils.sheet_new();
    if (!widgetKey)
        return defaultSheet;
    const name = ((_a = widgetKey.split('/')) === null || _a === void 0 ? void 0 : _a[1]) || "";
    if (!name)
        return defaultSheet;
    const exportPath = path.join(__dirname, '../', '../', '../', 'table-report-headers');
    const templatePath = path.join(exportPath, `${name}.xlsx`);
    if (!fs_1.default.existsSync(templatePath))
        return defaultSheet;
    const workBook = xlsx_1.default.readFile(templatePath);
    const workSheet = workBook.Sheets[workBook.SheetNames[0]];
    if (!workSheet['!ref'])
        return defaultSheet;
    return workSheet;
};
function xlsxConverter(req, res, chartData, dataArray, downloadConfig) {
    const { ctx } = req;
    ctx.log('EXPORT_XLS');
    const reqDataLength = req.body.data.length;
    if (reqDataLength > XLS_DATA_LIMIT) {
        ctx.logError(`EXPORT_XLS_DATA_LIMIT_ERROR`, {
            bytes: reqDataLength,
        });
        res.sendStatus(413);
        return;
    }
    const columns = [];
    columns.push({ wch: 15 });
    const titleRows = [];
    if (chartData.categories_ms || chartData.categories) {
        titleRows.push('');
    }
    chartData.graphs.forEach((graph) => {
        titleRows.push(graph.title);
        columns.push({ wch: 12 });
    });
    const rows = [];
    ctx.log('EXPORT_XLS_START_PREPARING');
    dataArray.forEach((item, i) => {
        let row;
        if (item) {
            row = chartData.categories_ms ? [new Date(item)] : [item];
        }
        else {
            row = [];
        }
        chartData.graphs.forEach((graph) => {
            const dataItem = graph.data[i];
            if (dataItem && dataItem.length >= MAX_EXCEL_CELL_LENGTH) {
                const cell = dataItem.slice(0, MAX_EXCEL_CELL_LENGTH - 3) + '...';
                row.push(cell);
            }
            else {
                let cellData = graph.data[i];
                if (graph.type === 'diff' && Array.isArray(cellData)) {
                    cellData = cellData[0];
                }
                if (isCell(cellData) && cellData.t === 'd') {
                    cellData.v = (0, date_utils_1.dateTime)({ input: cellData.v }).utc().toDate();
                }
                row.push(cellData);
            }
        });
        rows.push(row);
    });
    ctx.log('EXPORT_XLS_FINISH_PREPARING');
    ctx.log('EXPORT_XLS_ADD_WORKBOOK_SHEET');
    const worksheet = getWorkSheet(chartData.widgetKey);
    const headRange = worksheet['!ref'] ? xlsx_1.default.utils.decode_range(worksheet['!ref']) : xlsx_1.default.utils.decode_range('A1');
    if (!worksheet['!ref']) {
        xlsx_1.default.utils.sheet_add_aoa(worksheet, [titleRows], { origin: 'A1' });
    }
    xlsx_1.default.utils.sheet_add_aoa(worksheet, rows, { origin: { r: headRange.e.r + 1, c: headRange.s.c } });
    const workbook = xlsx_1.default.utils.book_new();
    xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Chart data');
    ctx.log('EXPORT_XLS_FINISH_ADD_WORKBOOK_SHEET');
    worksheet['!cols'] = [...columns];
    const mimeType = mime_1.default.lookup('.xlsx');
    res.setHeader('Content-disposition', `attachment; filename=${downloadConfig.filename}.xlsx`);
    res.setHeader('Content-type', mimeType);
    const file = `/tmp/${(0, uuid_1.v4)()}.xlsx`;
    try {
        xlsx_1.default.writeFileAsync(file, workbook, {}, () => {
            ctx.log('EXPORT_XLS_FILE_IS_WRITTEN');
            const fileStream = fs_1.default.createReadStream(file);
            fileStream.pipe(res);
            fileStream.on('close', async (error) => {
                if (error) {
                    res.send(500);
                    ctx.log(`error ${error.message}`);
                }
                (0, promises_1.unlink)(file).catch((e) => ctx.log(`error ${e.message}`));
            });
        });
    }
    catch (error) {
        let errorMessage = 'Failed to do something exceptional';
        if (error instanceof Error) {
            errorMessage = `error ${error.message}`;
        }
        ctx.log(errorMessage);
        res.sendStatus(500);
    }
}
