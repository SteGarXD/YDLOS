"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const misc_helpers_1 = require("../../utils/misc-helpers");
/**
 * Фаза 2.2: спидометр (Gauge) — один показатель, рендер через Highcharts solidgauge.
 * Возвращает данные в формате графика (graphs) и задаёт конфиг Highcharts для solidgauge.
 */
function prepareGauge({ placeholders, resultData, idToTitle, ChartEditor, }) {
    var _a, _b;
    const { data, order } = resultData;
    const measure = (_b = (_a = placeholders[0]) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b[0];
    if (typeof measure === 'undefined' || !(data === null || data === void 0 ? void 0 : data.length)) {
        return { graphs: [] };
    }
    const measureTitle = idToTitle[measure.guid];
    const measureIndex = (0, misc_helpers_1.findIndexInOrder)(order, measure, measureTitle);
    const rawValue = data[0][measureIndex];
    if (rawValue === undefined || rawValue === null) {
        return { graphs: [] };
    }
    const numValue = Number(rawValue);
    if (Number.isNaN(numValue)) {
        return { graphs: [] };
    }
    ChartEditor.updateHighchartsConfig({
        chart: { type: 'solidgauge' },
        yAxis: [{ min: 0, max: 100 }],
    });
    const graphs = [
        {
            type: 'solidgauge',
            data: [{ y: numValue, name: measureTitle || '' }],
        },
    ];
    return { graphs };
}
exports.default = prepareGauge;
