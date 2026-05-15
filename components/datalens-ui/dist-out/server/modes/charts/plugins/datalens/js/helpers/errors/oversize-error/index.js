"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOversizeError = getOversizeError;
const errors_1 = require("../../../constants/errors");
function getOversizeError({ type, limit, current }) {
    let code = '';
    let details = {};
    switch (type) {
        case errors_1.OversizeErrorType.Default: {
            code = 'ERR.CHARTS.ROWS_NUMBER_OVERSIZE';
            details = {
                rowsLength: current,
                rowsLimit: limit,
            };
            break;
        }
        case errors_1.OversizeErrorType.PivotTableCells: {
            code = 'ERR.CHARTS.TABLE_OVERSIZE';
            details = {
                type: 'cells',
                cellsCount: current,
                cellsLimit: limit,
            };
            break;
        }
        case errors_1.OversizeErrorType.PivotTableColumns: {
            code = 'ERR.CHARTS.TABLE_OVERSIZE';
            details = {
                type: 'columns',
                columnsCount: current,
                columnsLimit: limit,
            };
            break;
        }
        case errors_1.OversizeErrorType.SegmentsNumber: {
            code = 'ERR.CHARTS.SEGMENTS_OVERSIZE';
            details = {
                segmentsCount: current,
                segmentsLimit: limit,
            };
            break;
        }
    }
    return {
        code,
        details,
    };
}
