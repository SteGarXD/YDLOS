"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareD3Treemap = prepareD3Treemap;
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../shared");
const markdown_1 = require("../../../../../../../shared/utils/markdown");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_palettes_1 = require("../../../helpers/color-palettes");
const utils_1 = require("../../gravity-charts/utils");
const color_helpers_1 = require("../../utils/color-helpers");
const export_helpers_1 = require("../../utils/export-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
function prepareD3Treemap({ shared, placeholders, resultData, colors, colorsConfig, idToTitle, idToDataType, ChartEditor, defaultColorPaletteId, }) {
    var _a, _b, _c, _d;
    const dimensions = (_b = (_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.Dimensions)) === null || _a === void 0 ? void 0 : _a.items) !== null && _b !== void 0 ? _b : [];
    const dTypes = dimensions.map((item) => item.data_type);
    const useMarkdown = dimensions === null || dimensions === void 0 ? void 0 : dimensions.some(shared_1.isMarkdownField);
    const useHtml = dimensions === null || dimensions === void 0 ? void 0 : dimensions.some(shared_1.isHtmlField);
    const measures = (_d = (_c = placeholders.find((p) => p.id === shared_1.PlaceholderId.Measures)) === null || _c === void 0 ? void 0 : _c.items) !== null && _d !== void 0 ? _d : [];
    const color = colors[0];
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    const { data, order } = resultData;
    let treemap = [];
    const treemapIds = [];
    const hashTable = {};
    const valuesForColorData = {};
    const isFloat = measures[0] && measures[0].data_type === 'float';
    let colorData = {};
    if (color) {
        // We make the property non-enumerable so that it does not participate in the formation of the palette
        Object.defineProperty(valuesForColorData, 'colorGuid', {
            enumerable: false,
            value: color.guid,
        });
    }
    data.forEach((values) => {
        var _a, _b;
        let colorByDimension;
        if (color && color.type === 'DIMENSION') {
            const actualTitle = idToTitle[color.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, color, actualTitle);
            const colorValue = values[i];
            colorByDimension = colorValue;
        }
        const dPath = [];
        let lastDimensionItem;
        dimensions.forEach((item, level) => {
            if (item.type === 'PSEUDO') {
                return;
            }
            const actualTitle = idToTitle[item.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, item, actualTitle);
            const rawValue = values[i];
            let value;
            if ((0, shared_1.isDateField)({ data_type: dTypes[level] })) {
                value = (0, misc_helpers_1.formatDate)({
                    valueType: dTypes[level],
                    value: rawValue,
                    format: item.format,
                });
            }
            else if ((0, misc_helpers_1.isNumericalDataType)(dTypes[level])) {
                const formatting = (0, shared_1.getFormatOptions)(item);
                value = (0, misc_helpers_1.chartKitFormatNumberWrapper)(rawValue, {
                    lang: 'ru',
                    ...formatting,
                });
            }
            else {
                value = rawValue;
            }
            const treemapId = dPath.length >= 1 ? `id_${dPath[0]}/${value}` : `id_${dPath.join()}${value}`;
            const name = (0, shared_1.isMarkdownField)(item) ? (0, markdown_1.wrapMarkdownValue)(value) : value;
            const treemapItem = {
                id: treemapId,
                name,
                drillDownFilterValue: value,
            };
            if (dPath.length) {
                treemapItem.parentId = `id_${dPath.join('/')}`;
            }
            dPath.push(value);
            treemapItem.id = `id_${dPath.join('/')}`;
            if (level === dimensions.length - 1) {
                lastDimensionItem = treemapItem;
            }
            else if (!treemapIds.includes(treemapItem.id)) {
                treemap.push(treemapItem);
                treemapIds.push(treemapItem.id);
            }
        });
        const key = `id_${dPath.join('/')}`;
        measures.forEach((measureItem) => {
            const actualTitle = idToTitle[measureItem.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, measureItem, actualTitle);
            const value = values[i];
            const formatting = (0, shared_1.getFormatOptions)(measureItem);
            const label = (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(value), {
                lang: 'ru',
                ...(formatting !== null && formatting !== void 0 ? formatting : { precision: isFloat ? shared_1.MINIMUM_FRACTION_DIGITS : 0 }),
            });
            hashTable[key] = { value: value, label };
            if (color) {
                if (gradientMode) {
                    const colorTitle = idToTitle[color.guid];
                    const i = (0, misc_helpers_1.findIndexInOrder)(order, color, colorTitle);
                    const colorValue = values[i];
                    valuesForColorData[key] = colorValue;
                }
                else {
                    valuesForColorData[key] = colorByDimension;
                }
            }
        });
        if (lastDimensionItem) {
            lastDimensionItem.value = Number((_a = hashTable[key]) === null || _a === void 0 ? void 0 : _a.value);
            lastDimensionItem.label = (_b = hashTable[key]) === null || _b === void 0 ? void 0 : _b.label;
            let name = dPath;
            if (useMarkdown) {
                name = dPath.map((item) => (item ? (0, markdown_1.wrapMarkdownValue)(item) : item));
            }
            else if (useHtml) {
                name = dPath.map((item) => (item ? (0, ui_sandbox_1.wrapHtml)(item) : item));
            }
            lastDimensionItem.name = name;
            treemap.push(lastDimensionItem);
        }
    });
    if (color) {
        if (gradientMode) {
            colorData = (0, color_helpers_1.mapAndColorizeHashTableByGradient)(valuesForColorData, colorsConfig).colorData;
        }
        else {
            const { mountedColors, colors: paletteColors } = (0, color_palettes_1.getColorsSettings)({
                field: color,
                colorsConfig: shared.colorsConfig,
                defaultColorPaletteId,
                availablePalettes: colorsConfig.availablePalettes,
                customColorPalettes: colorsConfig.loadedColorPalettes,
            });
            colorData = (0, color_helpers_1.mapAndColorizeHashTableByPalette)({
                hashTable: valuesForColorData,
                colors: paletteColors,
                mountedColors,
            });
        }
        treemap = treemap.map((obj) => {
            const item = { ...obj };
            const colorDataValue = obj.id ? colorData[obj.id] : null;
            if (colorDataValue) {
                item.color = colorDataValue.backgroundColor;
            }
            return item;
        });
    }
    const dimensionsSize = dimensions.length;
    const maxPadding = 5;
    const levels = new Array(dimensionsSize)
        .fill(null)
        .map((_, index) => ({
        index: index + 1,
        padding: Math.min(maxPadding, (dimensionsSize - index) * 2 - 1),
    }));
    if (useMarkdown) {
        ChartEditor.updateConfig({ useMarkdown: true });
    }
    if (useHtml) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    const exportSettingsCols = dimensions.map((field, index) => {
        return (0, export_helpers_1.getExportColumnSettings)({ path: `name.${index}`, field });
    });
    exportSettingsCols.push((0, export_helpers_1.getExportColumnSettings)({ path: `value`, field: measures[0] }));
    const series = {
        type: 'treemap',
        name: '',
        layoutAlgorithm: 'squarify',
        dataLabels: {
            enabled: true,
            html: useMarkdown || useHtml,
        },
        levels,
        data: treemap,
        sorting: {
            enabled: true,
        },
        custom: {
            exportSettings: {
                columns: exportSettingsCols,
            },
        },
    };
    return (0, merge_1.default)((0, utils_1.getBaseChartConfig)(shared), {
        series: {
            data: [series],
        },
        legend: {
            enabled: false,
        },
        chart: {
            zoom: { enabled: false },
        },
    });
}
