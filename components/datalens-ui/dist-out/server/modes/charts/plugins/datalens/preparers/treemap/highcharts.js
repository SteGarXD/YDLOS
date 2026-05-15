"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareHighchartsTreemap = prepareHighchartsTreemap;
const shared_1 = require("../../../../../../../shared");
const markdown_1 = require("../../../../../../../shared/utils/markdown");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_palettes_1 = require("../../../helpers/color-palettes");
const color_helpers_1 = require("../../utils/color-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
function prepareHighchartsTreemap({ placeholders, resultData, colors, colorsConfig, idToTitle, idToDataType, ChartEditor, defaultColorPaletteId, shared, }) {
    // Dimensions
    const d = placeholders[0].items;
    const dTypes = d.map((item) => item.data_type);
    const useMarkdown = d === null || d === void 0 ? void 0 : d.some(shared_1.isMarkdownField);
    const useHtml = d === null || d === void 0 ? void 0 : d.some(shared_1.isHtmlField);
    // Measures
    const m = placeholders[1].items;
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
    const isFloat = m[0] && m[0].data_type === 'float';
    let multimeasure = false;
    let measureNamesLevel;
    let colorData = {};
    if (color) {
        // We make the property non-enumerable so that it does not participate in the formation of the palette
        Object.defineProperty(valuesForColorData, 'colorGuid', {
            enumerable: false,
            value: color.guid,
        });
    }
    const measureNames = m.map((measureItem) => idToTitle[measureItem.guid]);
    // TODO: think about why. After all, you can put only one field in the measures (Size) (treemap.tsx)
    if (measureNames.length > 1) {
        multimeasure = true;
        d.some((item, level) => {
            if (item.type === 'PSEUDO') {
                measureNamesLevel = level;
                return true;
            }
            else {
                return false;
            }
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
        d.forEach((item, level) => {
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
                treemapItem.parent = `id_${dPath.join('/')}`;
            }
            dPath.push(value);
            treemapItem.id = `id_${dPath.join('/')}`;
            if (level === d.length - 1) {
                lastDimensionItem = treemapItem;
            }
            else if (!treemapIds.includes(treemapItem.id)) {
                treemap.push(treemapItem);
                treemapIds.push(treemapItem.id);
            }
        });
        const key = `id_${dPath.join('/')}`;
        m.forEach((measureItem) => {
            const actualTitle = idToTitle[measureItem.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, measureItem, actualTitle);
            const value = values[i];
            const formatting = (0, shared_1.getFormatOptions)(measureItem);
            const label = (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(value), {
                lang: 'ru',
                ...(formatting !== null && formatting !== void 0 ? formatting : { precision: isFloat ? shared_1.MINIMUM_FRACTION_DIGITS : 0 }),
            });
            if (multimeasure) {
                const dPathSpecial = [...dPath];
                dPathSpecial.splice(measureNamesLevel, 0, actualTitle);
                const specialKey = `${dPathSpecial.join('/')}`;
                hashTable[specialKey] = { value: value, label };
            }
            else {
                hashTable[key] = { value: value, label };
            }
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
            const colorDataValue = colorData[obj.id];
            if (colorDataValue) {
                item.color = colorDataValue.backgroundColor;
            }
            return item;
        });
    }
    let levels;
    if (d.length === 1) {
        levels = [
            {
                level: 1,
                borderWidth: 1,
            },
        ];
    }
    else if (d.length === 2) {
        levels = [
            {
                level: 1,
                borderWidth: 3,
            },
            {
                level: 2,
                borderWidth: 1,
            },
        ];
    }
    else {
        levels = [
            {
                level: 1,
                borderWidth: 5,
            },
            {
                level: 2,
                borderWidth: 3,
            },
            {
                level: 3,
                borderWidth: 1,
            },
        ];
    }
    if (useMarkdown) {
        ChartEditor.updateConfig({ useMarkdown: true });
    }
    if (useHtml) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    const graphs = [
        {
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowTraversingTree: true,
            interactByLeaf: true,
            tooltip: {
                ...(isFloat && { valueDecimals: shared_1.MINIMUM_FRACTION_DIGITS }),
            },
            dataLabels: {
                enabled: true,
                align: 'left',
                verticalAlign: 'top',
                style: {
                    cursor: 'pointer',
                },
                ...((useMarkdown || useHtml) && {
                    useHTML: true,
                }),
            },
            levelIsConstant: false,
            levels,
            data: treemap,
        },
    ];
    return { graphs };
}
