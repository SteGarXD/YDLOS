"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGravityChartLine = prepareGravityChartLine;
const merge_1 = __importDefault(require("lodash/merge"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const shared_1 = require("../../../../../../../shared");
const utils_1 = require("../../gravity-charts/utils");
const dataLabels_1 = require("../../gravity-charts/utils/dataLabels");
const format_1 = require("../../gravity-charts/utils/format");
const config_helpers_1 = require("../../utils/config-helpers");
const axis_helpers_1 = require("../../utils/axis-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const axis_1 = require("../helpers/axis");
const segments_1 = require("../helpers/segments");
const prepare_line_data_1 = require("./prepare-line-data");
const LINE_CHART_AXIS_TITLE_STYLE = {
    fontSize: '13px',
    fontWeight: '400',
    fontColor: '#000000',
    letterSpacing: 'normal',
};
const SERIES_COLOR_BY_NAME = {
    Y: '#a1d8ee',
    'ВСЕГО': '#932893',
    'ПКЗ': '#269326',
    '61% загрузка': '#ff2e2e',
    '60% загрузка': '#ff2e2e',
    '80% загрузка': '#ffff2d',
    C: '#5b5bff',
    'С': '#5b5bff',
};
function normalizedSeriesTitle(rawTitle) {
    return String(rawTitle !== null && rawTitle !== void 0 ? rawTitle : '')
        .replace(/\s+/g, ' ')
        .trim();
}
function isClassCSeriesTitle(rawTitle) {
    const norm = normalizedSeriesTitle(rawTitle);
    if (norm === 'C' || norm === 'С') {
        return true;
    }
    if (norm.length === 1 && norm.toLowerCase() === 'c') {
        return true;
    }
    if (/class\s+c$/i.test(norm)) {
        return true;
    }
    if (/^класс\s+[cс]\s*$/i.test(norm)) {
        return true;
    }
    return false;
}
function forcedColorForSeriesTitle(rawTitle) {
    const norm = normalizedSeriesTitle(rawTitle);
    const direct = SERIES_COLOR_BY_NAME[norm];
    if (direct !== undefined) {
        return direct;
    }
    if (isClassCSeriesTitle(rawTitle)) {
        return SERIES_COLOR_BY_NAME.C;
    }
    return undefined;
}
const SERIES_ORDER = {
    Y: 0,
    'ВСЕГО': 1,
    'ПКЗ': 2,
    '61% загрузка': 3,
    '60% загрузка': 3,
    '80% загрузка': 4,
    C: 5,
    'С': 5,
};
function seriesOrderRank(seriesName) {
    const norm = normalizedSeriesTitle(seriesName);
    const fromMap = SERIES_ORDER[norm];
    if (fromMap !== undefined) {
        return fromMap;
    }
    if (isClassCSeriesTitle(seriesName)) {
        return SERIES_ORDER.C;
    }
    return Number.MAX_SAFE_INTEGER;
}
const DENSE_NUMERIC_X_CATEGORY_RANGE_LIMIT = 400;
function buildDenseNumericCategoryOrder(uniqueValues) {
    if (uniqueValues.length === 0) {
        return null;
    }
    const min = Math.min(...uniqueValues);
    const max = Math.max(...uniqueValues);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return null;
    }
    if (max - min > DENSE_NUMERIC_X_CATEGORY_RANGE_LIMIT) {
        return Array.from(new Set(uniqueValues)).sort((a, b) => b - a);
    }
    const lo = min > 0 ? 0 : min;
    const out = [];
    for (let v = max; v >= lo; v--) {
        out.push(v);
    }
    return out;
}
function buildDenseNumericXTickValues(categoriesDesc) {
    if (categoriesDesc.length === 0) {
        return [];
    }
    const out = [];
    for (let i = 0; i < categoriesDesc.length; i++) {
        const v = categoriesDesc[i];
        const isInt = Number.isFinite(v) && Math.floor(v) === v;
        if (i === 0 || (isInt && v % 3 === 0)) {
            out.push(String(v));
        }
    }
    return out;
}
function collectNumericXFromGraphs(graphs, categories) {
    const set = new Set();
    const catLen = categories.length;
    for (const g of graphs) {
        const data = g.data || [];
        const ys = data
            .map((pt) => pt === null || pt === void 0 ? void 0 : pt.y)
            .filter((y) => typeof y === 'number' && Number.isFinite(y));
        const isFlat = ys.length >= 2 && ys.every((y) => y === ys[0]);
        if (isFlat && data.length > 20) {
            continue;
        }
        for (const pt of data) {
            const idx = pt === null || pt === void 0 ? void 0 : pt.x;
            let n = null;
            if (typeof idx === 'number' && Number.isFinite(idx) && catLen > 0 && idx >= 0 && idx < catLen) {
                n = Number(categories[idx]);
            }
            else if (typeof idx === 'number' && Number.isFinite(idx)) {
                n = Number(idx);
            }
            if (n !== null && Number.isFinite(n)) {
                set.add(n);
            }
        }
    }
    return Array.from(set);
}
function isForcedTailSeriesName(name) {
    const normalized = name.toLowerCase().replace(/\s+/g, ' ').trim();
    return (normalized.includes('пкз') ||
        (/(^|\s)60(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        (/(^|\s)61(\s|%|$)/.test(normalized) && normalized.includes('заг')) ||
        (/(^|\s)80(\s|%|$)/.test(normalized) && normalized.includes('заг')));
}
function extendSelectedSeriesToRightEdge(seriesList, categoryCount, dataLabelsEnabled) {
    if (categoryCount < 2) {
        return;
    }
    const maxXIdx = categoryCount - 1;
    for (const s of seriesList) {
        const seriesName = String((s === null || s === void 0 ? void 0 : s.name) || '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            continue;
        }
        const pts = s.data;
        if (pts.length === 0) {
            continue;
        }
        let lastFiniteIndex = -1;
        let maxDataX = -Infinity;
        for (let i = 0; i < pts.length; i++) {
            const py = pts[i].y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                lastFiniteIndex = i;
            }
            const px = pts[i].x;
            if (typeof px === 'number' && Number.isFinite(px)) {
                maxDataX = Math.max(maxDataX, px);
            }
        }
        if (lastFiniteIndex < 0) {
            continue;
        }
        const anchor = pts[lastFiniteIndex];
        const y = anchor.y;
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            continue;
        }
        for (let i = lastFiniteIndex + 1; i < pts.length; i++) {
            const point = pts[i];
            const py = point.y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                continue;
            }
            point.y = y;
            if (anchor.custom !== undefined && point.custom === undefined) {
                point.custom = anchor.custom;
            }
            if (dataLabelsEnabled) {
                point.label = '';
            }
        }
        if (Number.isFinite(maxDataX) && maxDataX < maxXIdx) {
            const existingX = new Set();
            for (const p of pts) {
                if (typeof p.x === 'number' && Number.isFinite(p.x)) {
                    existingX.add(p.x);
                }
            }
            for (let x = Math.floor(maxDataX) + 1; x <= maxXIdx; x++) {
                if (existingX.has(x)) {
                    continue;
                }
                const tailPoint = {
                    x,
                    y,
                };
                if (anchor.custom !== undefined) {
                    tailPoint.custom = anchor.custom;
                }
                if (dataLabelsEnabled) {
                    tailPoint.label = '';
                }
                pts.push(tailPoint);
            }
        }
    }
}
function extendSelectedSeriesToLeftEdge(seriesList, categoryCount, dataLabelsEnabled) {
    if (categoryCount < 2) {
        return;
    }
    const leftmostIdx = 0;
    for (const s of seriesList) {
        const seriesName = String((s === null || s === void 0 ? void 0 : s.name) || '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            continue;
        }
        const pts = s.data;
        if (pts.length === 0) {
            continue;
        }
        let minDataX = Infinity;
        let anchor = null;
        for (const p of pts) {
            const px = p.x;
            const py = p.y;
            if (typeof px !== 'number' || !Number.isFinite(px)) {
                continue;
            }
            if (typeof py === 'number' && Number.isFinite(py)) {
                if (px < minDataX) {
                    minDataX = px;
                    anchor = p;
                }
            }
        }
        if (anchor === null || !Number.isFinite(minDataX) || minDataX <= leftmostIdx) {
            continue;
        }
        const y = anchor.y;
        if (typeof y !== 'number' || !Number.isFinite(y)) {
            continue;
        }
        const existingX = new Set();
        for (const p of pts) {
            if (typeof p.x === 'number' && Number.isFinite(p.x)) {
                existingX.add(p.x);
            }
        }
        const toPrepend = [];
        for (let x = leftmostIdx; x < minDataX; x++) {
            if (existingX.has(x)) {
                continue;
            }
            const headPoint = { x, y };
            if (anchor.custom !== undefined) {
                headPoint.custom = anchor.custom;
            }
            if (dataLabelsEnabled) {
                headPoint.label = '';
            }
            toPrepend.push(headPoint);
        }
        if (toPrepend.length > 0) {
            s.data = [...toPrepend, ...pts];
        }
    }
}
function sortForcedTailSeriesByX(seriesList) {
    for (const s of seriesList) {
        const seriesName = String((s === null || s === void 0 ? void 0 : s.name) || '').trim();
        if (!isForcedTailSeriesName(seriesName)) {
            continue;
        }
        s.data.sort((a, b) => {
            const ax = typeof a.x === 'number' && Number.isFinite(a.x) ? a.x : 0;
            const bx = typeof b.x === 'number' && Number.isFinite(b.x) ? b.x : 0;
            return ax - bx;
        });
    }
}
function prepareGravityChartLine(args) {
    var _a, _b, _c;
    const { labels, placeholders, disableDefaultSorting = false, shared, idToDataType, colors, shapes, visualizationId, sort, ChartEditor, } = args;
    const xPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.X);
    const xField = (_a = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.items) === null || _a === void 0 ? void 0 : _a[0];
    const yPlaceholder = placeholders.find((p) => p.id === shared_1.PlaceholderId.Y);
    const yFields = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.items) || [];
    const labelField = labels === null || labels === void 0 ? void 0 : labels[0];
    const isDataLabelsEnabled = Boolean(labelField);
    const chartConfig = (0, config_helpers_1.getConfigWithActualFieldTypes)({ config: shared, idToDataType });
    const xAxisMode = (_b = (0, shared_1.getXAxisMode)({ config: chartConfig })) !== null && _b !== void 0 ? _b : "discrete" /* AxisMode.Discrete */;
    const isCategoriesXAxis = !xField ||
        (0, axis_1.getAxisType)({
            field: xField,
            settings: xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings,
            axisMode: xAxisMode,
        }) === 'category' ||
        disableDefaultSorting;
    if (!xField || !yFields.length) {
        return {
            series: {
                data: [],
            },
        };
    }
    const preparedData = (0, prepare_line_data_1.prepareLineData)(args);
    const xCategories = preparedData.categories;
    const xNumericFromSeries = collectNumericXFromGraphs(preparedData.graphs, xCategories || []);
    const fallbackNumericUnique = Array.from(new Set((xCategories || [])
        .map((v) => Number(v))
        .filter((v) => Number.isFinite(v))));
    const uniqueNumericForDense = xNumericFromSeries.length > 0 ? xNumericFromSeries : fallbackNumericUnique;
    const numericCategoryOrder = isCategoriesXAxis && (0, shared_1.isNumberField)(xField)
        ? buildDenseNumericCategoryOrder(uniqueNumericForDense)
        : null;
    const numericCategoryIndexByValue = numericCategoryOrder
        ? new Map(numericCategoryOrder.map((v, i) => [String(v), i]))
        : null;
    const exportSettings = {
        columns: [
            (0, export_helpers_1.getExportColumnSettings)({ path: 'x', field: xField }),
            (0, export_helpers_1.getExportColumnSettings)({ path: 'y', field: yFields[0] }),
        ],
    };
    const colorItem = colors[0];
    if (colorItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'series.custom.colorValue', field: colorItem }));
    }
    const shapeItem = shapes[0];
    if (shapeItem) {
        exportSettings.columns.push((0, export_helpers_1.getExportColumnSettings)({ path: 'series.custom.shapeValue', field: shapeItem }));
    }
    const shouldUseHtmlForLabels = (0, shared_1.isMarkupField)(labelField) || (0, shared_1.isHtmlField)(labelField) || (0, shared_1.isMarkdownField)(labelField);
    const seriesData = preparedData.graphs.map((graph) => {
        const graphName = normalizedSeriesTitle((graph === null || graph === void 0 ? void 0 : graph.title) || '');
        const forcedColor = forcedColorForSeriesTitle((graph === null || graph === void 0 ? void 0 : graph.title) || '');
        const isForcedTailSeries = isForcedTailSeriesName(graphName);
        const emphasizedLineStyle = forcedColor !== undefined || isForcedTailSeries;
        return {
            name: graphName,
            type: 'line',
            color: forcedColor || graph.color,
            lineWidth: emphasizedLineStyle ? 1.2 : undefined,
            opacity: emphasizedLineStyle ? 1 : undefined,
            data: graph.data.reduce((acc, item, index) => {
                const rawY = item === null || item === void 0 ? void 0 : item.y;
                const dataItem = {
                    y: typeof rawY === 'number' && Number.isFinite(rawY) ? rawY : null,
                    custom: item.custom,
                };
                if (isDataLabelsEnabled) {
                    if (rawY === null || rawY === undefined) {
                        dataItem.label = '';
                    }
                    else if (shouldUseHtmlForLabels) {
                        dataItem.label = item === null || item === void 0 ? void 0 : item.label;
                    }
                    else {
                        dataItem.label = (0, dataLabels_1.getFormattedLabel)(item === null || item === void 0 ? void 0 : item.label, labelField);
                    }
                }
                if (isCategoriesXAxis) {
                    if (numericCategoryIndexByValue) {
                        const catKey = xCategories !== undefined && index < xCategories.length
                            ? String(xCategories[index])
                            : (item === null || item === void 0 ? void 0 : item.x) !== undefined && (item === null || item === void 0 ? void 0 : item.x) !== null
                                ? String(item.x)
                                : '';
                        const mapped = catKey !== '' ? numericCategoryIndexByValue.get(catKey) : undefined;
                        if (mapped === undefined) {
                            return acc;
                        }
                        dataItem.x = mapped;
                    }
                    else {
                        dataItem.x = index;
                    }
                }
                else if (!item && xCategories) {
                    dataItem.x = xCategories[index];
                }
                else {
                    dataItem.x = item === null || item === void 0 ? void 0 : item.x;
                }
                acc.push(dataItem);
                return acc;
            }, []),
            dataLabels: {
                enabled: isDataLabelsEnabled,
                html: shouldUseHtmlForLabels,
            },
            legend: {
                symbol: {
                    width: 36,
                },
            },
            dashStyle: graph.dashStyle,
            yAxis: graph.yAxis,
            custom: {
                ...graph.custom,
                exportSettings,
                colorValue: graph.colorValue,
                shapeValue: graph.shapeValue,
            },
        };
    });
    const categoryCountForTail = (numericCategoryOrder === null || numericCategoryOrder === void 0 ? void 0 : numericCategoryOrder.length) || ((xCategories === null || xCategories === void 0 ? void 0 : xCategories.length) || 0);
    if (categoryCountForTail > 0) {
        extendSelectedSeriesToLeftEdge(seriesData, categoryCountForTail, isDataLabelsEnabled);
        extendSelectedSeriesToRightEdge(seriesData, categoryCountForTail, isDataLabelsEnabled);
        sortForcedTailSeriesByX(seriesData);
    }
    let actualMaxX = 0;
    seriesData.forEach((s) => {
        s.data.forEach((p) => {
            if (typeof p.x === 'number' && p.x > actualMaxX) {
                actualMaxX = p.x;
            }
        });
    });
    const orderedSeriesData = [...seriesData].sort((a, b) => {
        const left = seriesOrderRank(String(a.name));
        const right = seriesOrderRank(String(b.name));
        if (left !== right) {
            return left - right;
        }
        return String(a.name).localeCompare(String(b.name), 'ru');
    });
    let legend;
    if (seriesData.length <= 1) {
        legend = { enabled: false };
    }
    const xSortItem = sort === null || sort === void 0 ? void 0 : sort.find((s) => s.guid === (xField === null || xField === void 0 ? void 0 : xField.guid));
    const isXSortedDescBySort = (xSortItem === null || xSortItem === void 0 ? void 0 : xSortItem.direction) === 'DESC';
    const isXReversedBySetting = (xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) && xPlaceholder.settings.axisOrder === 'desc';
    const isXReversed = isXReversedBySetting || isXSortedDescBySort;
    let xAxis = {};
    const hasPositiveNumericX = seriesData.some((series) => series.data.some((point) => typeof point.x === 'number' && Number(point.x) > 0));
    if (isCategoriesXAxis) {
        const rawCategories = (xCategories === null || xCategories === void 0 ? void 0 : xCategories.map(String)) || [];
        const sortedCategories = numericCategoryOrder
            ? numericCategoryOrder.map(String)
            : rawCategories;
        xAxis = {
            type: 'category',
            categories: sortedCategories,
            order: numericCategoryOrder ? undefined : isXReversed ? 'sortDesc' : undefined,
            labels: { rotation: 0, style: { fontSize: '11px' } },
            maxPadding: 0,
        };
    }
    else {
        if ((0, shared_1.isDateField)(xField)) {
            xAxis.type = 'datetime';
        }
        if ((0, shared_1.isNumberField)(xField)) {
            xAxis.type = ((_c = xPlaceholder === null || xPlaceholder === void 0 ? void 0 : xPlaceholder.settings) === null || _c === void 0 ? void 0 : _c.type) === 'logarithmic' ? 'logarithmic' : 'linear';
            if (hasPositiveNumericX) {
                xAxis.min = 0;
            }
            if (actualMaxX > 0) {
                xAxis.max = actualMaxX;
            }
            xAxis.maxPadding = 0;
        }
        if (isXReversed) {
            xAxis.order = 'reverse';
        }
    }
    if (xAxisTitleText) {
        xAxis = {
            ...xAxis,
            title: {
                text: xAxisTitleText,
                margin: 18,
                align: 'center',
                style: { ...LINE_CHART_AXIS_TITLE_STYLE },
            },
        };
    }
    const segmentsMap = (0, segments_1.getSegmentMap)(args);
    const segments = (0, sortBy_1.default)(Object.values(segmentsMap), (s) => s.index);
    const isSplitEnabled = false;
    const primarySegment = segments[0];
    const isYManual = (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) &&
        yPlaceholder.settings.scale === 'manual' &&
        Array.isArray(yPlaceholder.settings.scaleValue);
    let actualMaxY = 0;
    seriesData.forEach((s) => {
        s.data.forEach((p) => {
            const py = p.y;
            if (typeof py === 'number' && Number.isFinite(py)) {
                actualMaxY = Math.max(actualMaxY, py);
            }
        });
    });
    let yAxisTitleText;
    if (isSplitEnabled) {
        yAxisTitleText = primarySegment === null || primarySegment === void 0 ? void 0 : primarySegment.title;
    }
    else if (yPlaceholder === null || yPlaceholder === void 0 ? void 0 : yPlaceholder.settings) {
        const fromSettings = (0, axis_helpers_1.getAxisTitle)(yPlaceholder.settings, yFields[0]);
        if (fromSettings === null) {
            yAxisTitleText = undefined;
        }
        else if (typeof fromSettings === 'string' && fromSettings.trim()) {
            yAxisTitleText = fromSettings.trim();
        }
        else if (yFields[0]) {
            yAxisTitleText = (0, misc_helpers_1.getOriginalTitleOrTitle)(yFields[0]);
        }
    }
    else if (yFields[0]) {
        yAxisTitleText = (0, misc_helpers_1.getOriginalTitleOrTitle)(yFields[0]);
    }
    const yAxisPrimary = {
        title: yAxisTitleText
            ? {
                text: yAxisTitleText,
                margin: 18,
                style: { ...LINE_CHART_AXIS_TITLE_STYLE },
            }
            : undefined,
        plotIndex: (primarySegment === null || primarySegment === void 0 ? void 0 : primarySegment.index) || 0,
        position: 'right',
        min: 0,
        maxPadding: 0,
        labels: { style: { fontSize: '11px' } },
    };
    if (!isYManual && actualMaxY > 0) {
        yAxisPrimary.max = Math.ceil(actualMaxY * 1.08);
    }
    const nrsParam = String((((ChartEditor === null || ChartEditor === void 0 ? void 0 : ChartEditor.getParam) && ChartEditor.getParam('nrs')) || '')).trim();
    let t = String((((shared === null || shared === void 0 ? void 0 : shared.extraSettings) && shared.extraSettings.title) || '')).trim();
    if (nrsParam && t.includes('№')) {
        t = t.replace(/№\s*(?:\{\{nrs\}\}|\S*)/, `№ ${nrsParam}`);
    }
    const resolvedTitle = t || undefined;
    const config = {
        title: resolvedTitle ? { text: resolvedTitle } : undefined,
        series: {
            data: orderedSeriesData,
        },
        xAxis,
        yAxis: [yAxisPrimary],
        split: {
            enable: isSplitEnabled,
            gap: '40px',
            plots: segments.map(() => {
                return {};
            }),
        },
        legend,
    };
    if (yFields[0]) {
        config.tooltip = {
            valueFormat: (0, format_1.getFieldFormatOptions)({ field: yFields[0] }),
        };
    }
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)({
        extraSettings: shared.extraSettings,
        visualization: { placeholders, id: visualizationId },
    }), config);
}
