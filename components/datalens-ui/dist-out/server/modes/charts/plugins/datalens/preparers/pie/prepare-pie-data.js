"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preparePieData = preparePieData;
const shared_1 = require("../../../../../../../shared");
const markdown_1 = require("../../../../../../../shared/utils/markdown");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_palettes_1 = require("../../../helpers/color-palettes");
const color_helpers_1 = require("../../utils/color-helpers");
const constants_1 = require("../../utils/constants");
const misc_helpers_1 = require("../../utils/misc-helpers");
const action_params_1 = require("../helpers/action-params");
const utils_1 = require("./utils");
function mapAndColorizePieByGradient(points, colorsConfig) {
    const colorValues = points.map((point) => Number(point.colorValue));
    const gradientThresholdValues = (0, color_helpers_1.getThresholdValues)(colorsConfig, colorValues);
    const gradientColors = (0, color_helpers_1.getColorsByMeasureField)({
        values: colorValues,
        colorsConfig,
        gradientThresholdValues,
    });
    points.forEach((point) => {
        const pointColorValue = Number(point.colorValue);
        if (gradientColors[pointColorValue]) {
            point.color = gradientColors[pointColorValue];
        }
    });
    return points;
}
function getPieSegmentColor({ colorValue, usedColors, colors, mountedColors, }) {
    if (!usedColors.has(colorValue)) {
        usedColors.set(colorValue, (0, constants_1.getColor)(usedColors.size, colors));
    }
    if (colorValue && mountedColors[colorValue]) {
        return (0, constants_1.getMountedColor)({
            mountedColors,
            colors,
            value: colorValue,
        });
    }
    return usedColors.get(colorValue);
}
// eslint-disable-next-line complexity
function preparePieData(args) {
    var _a, _b, _c, _d, _e, _f;
    const { placeholders, resultData, sort, labels, colorsConfig, idToTitle, idToDataType, ChartEditor, disableDefaultSorting = false, shared, defaultColorPaletteId, } = args;
    const { data, order, totals } = resultData;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const measure = (_a = placeholders.find((p) => p.id === shared_1.PlaceholderId.Measures)) === null || _a === void 0 ? void 0 : _a.items[0];
    let colorField = (_b = placeholders.find((p) => p.id === shared_1.PlaceholderId.Colors)) === null || _b === void 0 ? void 0 : _b.items[0];
    if ((0, shared_1.isFieldHierarchy)(colorField)) {
        const drillDownLevel = ((_d = (_c = shared.sharedData) === null || _c === void 0 ? void 0 : _c.drillDownData) === null || _d === void 0 ? void 0 : _d.level) || 0;
        colorField = colorField.fields[Math.min(drillDownLevel, colorField.fields.length - 1)];
    }
    if (colorField) {
        colorField = {
            ...colorField,
            data_type: idToDataType[colorField.guid],
        };
    }
    const isHtmlColor = (0, shared_1.isHtmlField)(colorField);
    let dimensionField = (_e = placeholders.find((p) => p.id === shared_1.PlaceholderId.Dimensions)) === null || _e === void 0 ? void 0 : _e.items[0];
    if (dimensionField) {
        dimensionField = {
            ...dimensionField,
            data_type: idToDataType[dimensionField.guid],
        };
    }
    const isHtmlDimension = (0, shared_1.isHtmlField)(dimensionField);
    if (!measure) {
        return { graphs: [] };
    }
    const colorIndex = colorField
        ? (0, misc_helpers_1.findIndexInOrder)(order, colorField, idToTitle[colorField.guid])
        : -1;
    const shouldUseGradient = (0, utils_1.isColoringByMeasure)(args);
    const dimensionIndex = dimensionField
        ? (0, misc_helpers_1.findIndexInOrder)(order, dimensionField, idToTitle[dimensionField.guid])
        : -1;
    const labelItem = labels === null || labels === void 0 ? void 0 : labels[0];
    const labelField = labelItem
        ? { ...labelItem, data_type: idToDataType[labelItem.guid] }
        : labelItem;
    const labelIndex = labelField
        ? (0, misc_helpers_1.findIndexInOrder)(order, labelField, idToTitle[labelField.guid])
        : -1;
    const isMarkdownLabel = (0, shared_1.isMarkdownField)(labelItem);
    const isMarkupLabel = (0, shared_1.isMarkupField)(labelItem);
    const isHtmlLabel = (0, shared_1.isHtmlField)(labelItem);
    const measureIndex = (0, misc_helpers_1.findIndexInOrder)(order, measure, idToTitle[measure.guid]);
    const measureDataType = idToDataType[measure.guid] || measure.data_type;
    if (measureIndex === -1) {
        return { graphs: [] };
    }
    const title = idToTitle[measure.guid];
    const name = title.includes(measure.guid) && measure.originalTitle ? measure.originalTitle : title;
    const measureFormatting = (0, shared_1.getFormatOptions)(measure);
    const labelFormatting = (0, shared_1.isMeasureValue)(labelField)
        ? measureFormatting
        : (0, shared_1.getFormatOptions)(labelField);
    const labelFinalDataType = (0, shared_1.isPseudoField)(labelField) ? measureDataType : labelField === null || labelField === void 0 ? void 0 : labelField.data_type;
    const pie = {
        name,
        tooltip: measureFormatting && Object.keys(measureFormatting).length
            ? {
                chartKitFormatting: true,
                chartKitPrecision: measureFormatting.precision,
                chartKitPrefix: measureFormatting.prefix,
                chartKitPostfix: measureFormatting.postfix,
                chartKitUnit: measureFormatting.unit,
                chartKitFormat: measureFormatting.format,
                chartKitLabelMode: measureFormatting.labelMode,
                chartKitShowRankDelimiter: measureFormatting.showRankDelimiter,
            }
            : {
                chartKitFormatting: true,
                chartKitPrecision: measureDataType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0,
            },
        dataLabels: {
            ...(labelFormatting && Object.keys(labelFormatting).length
                ? {
                    // need to reset dataLabels.format to use dataLabels.formatter
                    format: null,
                    chartKitFormatting: true,
                    chartKitPrecision: labelFormatting.precision,
                    chartKitPrefix: labelFormatting.prefix,
                    chartKitPostfix: labelFormatting.postfix,
                    chartKitUnit: labelFormatting.unit,
                    chartKitLabelMode: labelFormatting.labelMode,
                    chartKitFormat: labelFormatting.format,
                    chartKitShowRankDelimiter: labelFormatting.showRankDelimiter,
                }
                : {
                    chartKitFormatting: true,
                    chartKitPrecision: labelFinalDataType === shared_1.DATASET_FIELD_TYPES.FLOAT
                        ? shared_1.MINIMUM_FRACTION_DIGITS
                        : 0,
                }),
            useHTML: (_f = (isMarkdownLabel || isMarkupLabel || isHtmlLabel)) !== null && _f !== void 0 ? _f : undefined,
        },
    };
    // eslint-disable-next-line complexity
    const pieData = data.reduce((acc, values) => {
        var _a;
        const dimensionValue = values[dimensionIndex];
        const measureValue = values[measureIndex];
        const colorFieldValue = values[colorIndex];
        const labelValue = values[labelIndex];
        let colorValue = name;
        const legendParts = [];
        const formattedNameParts = [];
        if (colorField && typeof colorFieldValue !== 'undefined') {
            if (shouldUseGradient) {
                colorValue = Number(colorFieldValue);
            }
            else {
                colorValue = (0, shared_1.getDistinctValue)(colorFieldValue);
                legendParts.push(String(colorFieldValue));
                formattedNameParts.push(String((0, utils_1.getFormattedValue)(colorFieldValue, colorField)));
            }
        }
        if (dimensionField) {
            legendParts.push(String(dimensionValue));
            formattedNameParts.push(String((0, utils_1.getFormattedValue)(dimensionValue, dimensionField)));
        }
        const pointName = legendParts.length
            ? legendParts.join(': ')
            : (0, shared_1.getFakeTitleOrTitle)(measure);
        const drillDownFilterValue = pointName;
        let formattedName = formattedNameParts.join(': ');
        if (isHtmlColor || isHtmlDimension) {
            formattedName = (0, ui_sandbox_1.wrapHtml)(formattedName);
        }
        const shouldWrapPointName = isHtmlColor || isHtmlDimension;
        const point = {
            name: shouldWrapPointName ? (0, ui_sandbox_1.wrapHtml)(pointName) : pointName,
            formattedName,
            drillDownFilterValue,
            y: Number(measureValue),
            colorGuid: colorField === null || colorField === void 0 ? void 0 : colorField.guid,
            colorValue,
        };
        if (labelField) {
            if ((0, shared_1.isPseudoField)(labelField)) {
                point.label = (0, shared_1.isMeasureValue)(labelField) ? Number(measureValue) : formattedName;
            }
            else if ((0, shared_1.isNumberField)(labelField)) {
                // The value will be formatted using dataLabels.chartKitFormatting
                point.label = Number(labelValue);
            }
            else if (labelValue && isMarkdownLabel) {
                point.label = (0, markdown_1.wrapMarkdownValue)(labelValue);
            }
            else if (labelValue && isMarkupLabel) {
                point.label = (0, shared_1.wrapMarkupValue)(labelValue);
            }
            else if (labelValue && isHtmlLabel) {
                point.label = (0, ui_sandbox_1.wrapHtml)(labelValue);
            }
            else {
                point.label = (0, utils_1.getFormattedValue)(labelValue, {
                    ...labelField,
                    data_type: idToDataType[labelField.guid],
                });
            }
        }
        if ((_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable) {
            const actionParams = {};
            (0, action_params_1.addActionParamValue)(actionParams, dimensionField, dimensionValue);
            (0, action_params_1.addActionParamValue)(actionParams, colorField, colorValue);
            point.custom = {
                actionParams,
            };
        }
        if (acc.get(pointName)) {
            pie.pointConflict = true;
        }
        acc.set(pointName, point);
        return acc;
    }, new Map());
    pie.data = Array.from(pieData.values())
        // We remove negative values, since pie does not know how to display them
        .filter((point) => point.y > 0);
    if (!disableDefaultSorting && (!sort || !sort.length)) {
        pie.data.sort((a, b) => {
            return a.y > b.y ? -1 : a.y < b.y ? 1 : 0;
        });
    }
    if (shouldUseGradient) {
        pie.data = mapAndColorizePieByGradient(pie.data, colorsConfig);
    }
    else {
        const { mountedColors, colors } = (0, color_palettes_1.getColorsSettings)({
            field: colorField,
            colorsConfig: colorsConfig,
            defaultColorPaletteId,
            availablePalettes: colorsConfig.availablePalettes,
            customColorPalettes: colorsConfig.loadedColorPalettes,
        });
        const usedColors = new Map();
        pie.data.forEach((d) => {
            d.color = getPieSegmentColor({
                colorValue: d.colorValue,
                colors,
                usedColors,
                mountedColors,
            });
        });
    }
    if (isMarkdownLabel) {
        ChartEditor.updateConfig({ useMarkdown: true });
    }
    if (isMarkupLabel) {
        ChartEditor.updateConfig({ useMarkup: true });
    }
    if (isHtmlColor || isHtmlDimension || [labelField].some(shared_1.isHtmlField)) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    return {
        graphs: [pie],
        totals: totals.find((value) => value),
        label: labelField,
        measure,
        color: colorField,
        dimension: dimensionField,
    };
}
exports.default = preparePieData;
