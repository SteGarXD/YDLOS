"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareScatter = prepareScatter;
const shared_1 = require("../../../../../../../shared");
const markdown_1 = require("../../../../../../../shared/utils/markdown");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_helpers_1 = require("../../utils/color-helpers");
const constants_1 = require("../../utils/constants");
const geo_helpers_1 = require("../../utils/geo-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const action_params_1 = require("../helpers/action-params");
const shape_1 = require("./helpers/shape");
const tooltip_1 = require("./helpers/tooltip");
// eslint-disable-next-line complexity
function prepareScatter(options) {
    var _a, _b, _c;
    const geopointsConfig = (options.geopointsConfig || {});
    const { placeholders, resultData, colors, colorsConfig, idToTitle, idToDataType, shapes, shapesConfig, ChartEditor, shared, defaultColorPaletteId, } = options;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnable = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const { data, order } = resultData;
    const x = placeholders[0].items[0];
    if (!x) {
        return { graphs: [] };
    }
    const y = placeholders[1].items[0];
    if (!y) {
        return { graphs: [] };
    }
    const z = placeholders[2].items[0];
    const size = (_b = placeholders[3]) === null || _b === void 0 ? void 0 : _b.items[0];
    const color = colors && colors[0];
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    const shape = shapes === null || shapes === void 0 ? void 0 : shapes[0];
    const shapesConfigured = Object.keys((shapesConfig === null || shapesConfig === void 0 ? void 0 : shapesConfig.mountedShapes) || {}).length > 0;
    const xDataType = idToDataType[x.guid];
    const xIsNumber = (0, misc_helpers_1.isNumericalDataType)(xDataType);
    const xIsDate = (0, shared_1.isDateField)({ data_type: xDataType });
    const yDataType = idToDataType[y.guid];
    const yIsNumber = (0, misc_helpers_1.isNumericalDataType)(yDataType);
    const yIsDate = (0, shared_1.isDateField)({ data_type: yDataType });
    const cDataType = color && idToDataType[color.guid];
    const points = [];
    const xCategories = [];
    const yCategories = [];
    let minColorValue = Infinity;
    let maxColorValue = -Infinity;
    let sizeMinValue, sizeMaxValue;
    if (size) {
        data.forEach((values) => {
            const sizeTitle = idToTitle[size.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, size, sizeTitle);
            const pointValue = Number(values[i]);
            [sizeMinValue, sizeMaxValue] = (0, geo_helpers_1.getExtremeValues)({
                value: pointValue,
                min: sizeMinValue,
                max: sizeMaxValue,
            });
        });
    }
    const keys = new Set(['x', 'y']);
    const xFormatting = (0, shared_1.getFormatOptions)(x);
    const yFormatting = (0, shared_1.getFormatOptions)(y);
    // eslint-disable-next-line complexity
    data.forEach((values) => {
        var _a;
        const xTitle = idToTitle[x.guid];
        const xi = (0, misc_helpers_1.findIndexInOrder)(order, x, xTitle);
        const xValueRaw = values[xi];
        let xValue;
        let zValueRaw;
        const point = {};
        if (xValueRaw === null || xValueRaw === undefined) {
            return;
        }
        xValue = xValueRaw;
        if (xIsNumber) {
            xValue = Number(xValueRaw);
        }
        else if (xIsDate) {
            xValue = new Date(xValueRaw);
            if (xDataType) {
                xValue.setTime((0, misc_helpers_1.getTimezoneOffsettedTime)(xValue));
            }
            xValue = xValue.getTime();
        }
        if (xIsDate) {
            point.xLabel = (0, misc_helpers_1.formatDate)({
                valueType: xDataType,
                value: xValue,
                format: x.format,
                utc: true,
            });
        }
        else if (xIsNumber) {
            point.xLabel = (0, misc_helpers_1.chartKitFormatNumberWrapper)(xValue, {
                lang: 'ru',
                ...(xFormatting !== null && xFormatting !== void 0 ? xFormatting : {
                    precision: xDataType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0,
                }),
            });
        }
        else {
            let value = xValue;
            if ((0, shared_1.isMarkdownField)(x)) {
                value = (0, markdown_1.wrapMarkdownValue)(value);
            }
            else if ((0, shared_1.isHtmlField)(x)) {
                value = (0, ui_sandbox_1.wrapHtml)(value);
            }
            point.xLabel = value;
        }
        let indexOfXValue = xCategories.indexOf(xValue);
        if (indexOfXValue === -1) {
            xCategories.push(xValue);
            indexOfXValue = xCategories.length - 1;
        }
        if (!xIsNumber && !xIsDate) {
            xValue = indexOfXValue;
        }
        const yTitle = idToTitle[y.guid];
        const yi = (0, misc_helpers_1.findIndexInOrder)(order, y, yTitle);
        const yValueRaw = values[yi];
        let yValue = yValueRaw;
        if (yIsNumber) {
            yValue = Number(yValueRaw);
        }
        else if (yIsDate) {
            const yValueDate = new Date(String(yValueRaw));
            if (y.data_type === 'datetime' || y.data_type === 'genericdatetime') {
                yValueDate.setTime((0, misc_helpers_1.getTimezoneOffsettedTime)(yValueDate));
            }
            yValue = yValueDate.getTime();
        }
        if (yIsDate) {
            point.yLabel = (0, misc_helpers_1.formatDate)({
                valueType: yDataType,
                value: yValue,
                format: y.format,
                utc: true,
            });
        }
        else if (yIsNumber) {
            point.yLabel = (0, misc_helpers_1.chartKitFormatNumberWrapper)(yValue, {
                lang: 'ru',
                ...(yFormatting !== null && yFormatting !== void 0 ? yFormatting : {
                    precision: yDataType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0,
                }),
            });
        }
        else {
            let yLabel = String(yValue);
            if ((0, shared_1.isMarkdownField)(y)) {
                yLabel = (0, markdown_1.wrapMarkdownValue)(yLabel);
            }
            else if ((0, shared_1.isHtmlField)(y)) {
                yLabel = (0, ui_sandbox_1.wrapHtml)(yLabel);
            }
            point.yLabel = yLabel;
        }
        let indexOfYValue = yCategories.indexOf(yValue);
        if (indexOfYValue === -1) {
            yCategories.push(yValue);
            indexOfYValue = yCategories.length - 1;
        }
        if (!yIsNumber && !yIsDate) {
            yValue = indexOfYValue;
        }
        point.x = xValue;
        point.y = yValue;
        if (z) {
            const zTitle = idToTitle[z.guid];
            const zi = (0, misc_helpers_1.findIndexInOrder)(order, z, zTitle);
            zValueRaw = values[zi];
            let formattedZValue = zValueRaw;
            if ((0, misc_helpers_1.isNumericalDataType)(z.data_type)) {
                const formatting = (0, shared_1.getFormatOptions)(z);
                if (formatting) {
                    formattedZValue = (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(formattedZValue), {
                        lang: 'ru',
                        ...formatting,
                    });
                }
            }
            if ((0, shared_1.isStringField)(z)) {
                if ((0, shared_1.isMarkdownField)(z)) {
                    formattedZValue = (0, markdown_1.wrapMarkdownValue)(zValueRaw);
                }
                else if ((0, shared_1.isHtmlField)(z)) {
                    formattedZValue = (0, ui_sandbox_1.wrapHtml)(zValueRaw);
                }
            }
            if ((0, shared_1.isMarkupField)(z)) {
                formattedZValue = (0, shared_1.wrapMarkupValue)(zValueRaw);
            }
            point.name = formattedZValue || '';
        }
        else {
            delete point.name;
            keys.delete('x');
        }
        let radius;
        if (size) {
            const sizeTitle = idToTitle[size.guid];
            keys.add('sizeValue');
            const i = (0, misc_helpers_1.findIndexInOrder)(order, size, sizeTitle);
            const pointValue = Number(values[i]);
            point.sizeValue = pointValue;
            point.sizeLabel = (0, misc_helpers_1.chartKitFormatNumberWrapper)(pointValue, {
                lang: 'ru',
                ...(0, shared_1.getFormatOptions)(size),
            });
            radius = (0, misc_helpers_1.getPointRadius)({
                current: pointValue,
                min: sizeMinValue,
                max: sizeMaxValue,
                geopointsConfig,
            });
        }
        else {
            radius = geopointsConfig === null || geopointsConfig === void 0 ? void 0 : geopointsConfig.radius;
        }
        point.marker = {
            radius,
        };
        if (color) {
            const cTitle = idToTitle[color.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, color, cTitle);
            const colorValue = values[i];
            let colorLabel = colorValue;
            if ((0, shared_1.isMarkdownField)(color)) {
                colorLabel = (0, markdown_1.wrapMarkdownValue)(String(colorValue));
            }
            else if ((0, shared_1.isHtmlField)(color)) {
                colorLabel = (0, ui_sandbox_1.wrapHtml)(String(colorValue));
            }
            if (gradientMode) {
                const numberColorValue = Number(colorValue);
                if (numberColorValue < minColorValue) {
                    minColorValue = numberColorValue;
                }
                if (numberColorValue > maxColorValue) {
                    maxColorValue = numberColorValue;
                }
                const formatting = (0, shared_1.getFormatOptions)(color);
                point.cLabel = (0, misc_helpers_1.chartKitFormatNumberWrapper)(numberColorValue, {
                    lang: 'ru',
                    ...(formatting !== null && formatting !== void 0 ? formatting : {
                        precision: cDataType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0,
                    }),
                });
                point.value = numberColorValue;
                point.colorValue = numberColorValue;
                keys.add('colorValue');
            }
            else {
                point.value = colorValue;
                point.colorValue = colorValue;
                point.cLabel = colorLabel;
                point.colorGuid = colors[0] ? colors[0].guid : undefined;
            }
        }
        if (shape) {
            const cTitle = idToTitle[shape.guid];
            const i = (0, misc_helpers_1.findIndexInOrder)(order, shape, cTitle);
            const shapeValue = (_a = values[i]) !== null && _a !== void 0 ? _a : '';
            let shapeLabel = shapeValue;
            if ((0, shared_1.isMarkdownField)(shape)) {
                shapeLabel = (0, markdown_1.wrapMarkdownValue)(shapeValue);
            }
            else if ((0, shared_1.isHtmlField)(shape)) {
                shapeLabel = (0, ui_sandbox_1.wrapHtml)(shapeValue);
            }
            else if ((0, shared_1.isMarkupField)(shape)) {
                shapeLabel = (0, shared_1.wrapMarkupValue)(shapeValue);
            }
            point.shapeValue = shapeValue;
            point.sLabel = shapeLabel;
        }
        else if (shapesConfigured) {
            const shapeValue = yTitle;
            point.shapeValue = shapeValue;
            point.sLabel = shapeValue;
        }
        if (isActionParamsEnable) {
            const actionParams = {};
            (0, action_params_1.addActionParamValue)(actionParams, x, xValueRaw);
            (0, action_params_1.addActionParamValue)(actionParams, y, yValueRaw);
            (0, action_params_1.addActionParamValue)(actionParams, z, zValueRaw);
            point.custom = {
                ...point.custom,
                actionParams,
            };
        }
        points.push(point);
    });
    let graphs = [{ data: points }];
    if (color) {
        if (gradientMode) {
            (0, color_helpers_1.mapAndColorizePointsByGradient)(points, colorsConfig);
        }
        else {
            graphs = (0, color_helpers_1.mapAndColorizePointsByPalette)({
                points,
                colorsConfig,
                defaultColorPaletteId,
                colorField: color,
            });
        }
        if (graphs.length) {
            graphs[0].title = color.fakeTitle || idToTitle[color.guid];
        }
    }
    else {
        const yField = { ...y, title: (_c = idToTitle[y.guid]) !== null && _c !== void 0 ? _c : y.title };
        const value = (0, shared_1.getFakeTitleOrTitle)(yField);
        const colorFromConfig = (0, constants_1.getMountedColor)({ ...colorsConfig, value }) || colorsConfig.colors[0];
        graphs.forEach((graph) => {
            graph.color = colorFromConfig;
        });
    }
    if (shape || shapesConfigured) {
        graphs = (0, shape_1.mapPointsByShape)({ graphs, shapesConfig, field: shape });
    }
    else {
        graphs.forEach((graph) => {
            graph.marker = {
                symbol: shared_1.POINT_SHAPES_IN_ORDER[0],
            };
        });
    }
    if ((0, shared_1.isMarkdownField)(color) || (0, shared_1.isMarkdownField)(shape)) {
        graphs.forEach((g) => {
            g.name = (0, markdown_1.wrapMarkdownValue)(g.name);
        });
    }
    else if ((0, shared_1.isHtmlField)(color) || (0, shared_1.isHtmlField)(shape)) {
        graphs.forEach((g) => {
            g.name = (0, ui_sandbox_1.wrapHtml)(g.name);
        });
    }
    let categories;
    if (!xIsNumber && !xIsDate) {
        categories = xCategories;
        const categoryField = x ? { ...x, data_type: xDataType !== null && xDataType !== void 0 ? xDataType : x === null || x === void 0 ? void 0 : x.data_type } : undefined;
        const categoriesFormatter = (0, misc_helpers_1.getCategoryFormatter)({
            field: categoryField,
        });
        categories = categories === null || categories === void 0 ? void 0 : categories.map((c) => categoriesFormatter(String(c)));
    }
    const hasMarkdown = [x, y, z, size, color, shape].some((field) => (0, shared_1.isMarkdownField)(field));
    if (hasMarkdown) {
        ChartEditor.updateConfig({ useMarkdown: true });
    }
    const hasMarkup = [x, y, z, size, color, shape].some((field) => (0, shared_1.isMarkupField)(field));
    if (hasMarkup) {
        ChartEditor.updateConfig({ useMarkup: true });
    }
    const hasHtml = [x, y, z, size, color, shape].some((field) => (0, shared_1.isHtmlField)(field));
    if (hasHtml) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    graphs.forEach((graph) => {
        var _a, _b, _c, _d;
        graph.keys = Array.from(keys);
        graph.custom = {
            ...graph.custom,
            tooltipOptions: (0, tooltip_1.getScatterTooltipOptions)({ placeholders, shared }),
        };
        if (isActionParamsEnable) {
            const actionParams = {};
            (0, action_params_1.addActionParamValue)(actionParams, color, (_b = (_a = graph.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.colorValue);
            (0, action_params_1.addActionParamValue)(actionParams, shape, (_d = (_c = graph.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.shapeValue);
            graph.custom.actionParams = actionParams;
        }
    });
    return {
        x,
        y,
        z,
        color,
        shape,
        minColorValue,
        maxColorValue,
        colorsConfig,
        size,
        graphs: graphs,
        categories,
    };
}
