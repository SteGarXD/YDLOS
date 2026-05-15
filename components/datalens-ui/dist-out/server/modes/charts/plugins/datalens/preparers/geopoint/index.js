"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareGeopoint = prepareGeopoint;
const escape_1 = __importDefault(require("lodash/escape"));
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../../shared");
const ui_sandbox_1 = require("../../../../../../../shared/utils/ui-sandbox");
const color_palettes_1 = require("../../../helpers/color-palettes");
const color_helpers_1 = require("../../utils/color-helpers");
const constants_1 = require("../../utils/constants");
const geo_helpers_1 = require("../../utils/geo-helpers");
const misc_helpers_1 = require("../../utils/misc-helpers");
const action_params_1 = require("../helpers/action-params");
const constants_2 = require("./constants");
const getPointConfig = ({ stringifyedCoordinates, columnIndex, geopointsConfig, }) => {
    const coordinates = JSON.parse(stringifyedCoordinates);
    return {
        feature: {
            geometry: {
                type: 'Point',
                coordinates,
            },
            properties: {
                radius: geopointsConfig.radius || constants_2.DEFAULT_POINT_RADIUS,
                rawText: true,
            },
        },
        options: {
            iconColor: constants_2.DEFAULT_ICON_COLOR,
            preset: 'chartkit#chips',
            zIndex: constants_1.GEO_MAP_LAYERS_LEVEL.GEOPOINT,
        },
        columnIndex,
    };
};
const prepareValue = (value, valueType, formatting) => {
    if (valueType && (0, misc_helpers_1.isNumericalDataType)(valueType)) {
        return (0, misc_helpers_1.chartKitFormatNumberWrapper)(value, {
            lang: 'ru',
            ...(formatting !== null && formatting !== void 0 ? formatting : { precision: valueType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0 }),
        });
    }
    return value;
};
const setPointProperty = ({ point, propName, propValue, propType, formatting, }) => {
    if (!point) {
        return;
    }
    point.feature.properties[propName] = prepareValue(propValue, propType, formatting);
};
// eslint-disable-next-line complexity
function prepareGeopoint(options, { isClusteredPoints = false } = {}) {
    var _a, _b, _c;
    const { colors, colorsConfig, tooltips, tooltipConfig, labels, placeholders, resultData: { data, order }, idToTitle, shared, idToDataType, ChartEditor, defaultColorPaletteId, } = options;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnabled = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const geopointsConfig = (options.geopointsConfig || {});
    const layerSettings = (options.layerSettings ||
        {});
    const ALPHA = (0, geo_helpers_1.getLayerAlpha)(layerSettings);
    const allPoints = {};
    const colorValues = [];
    const color = colors[0];
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    const size = placeholders[1].items[0];
    const coordinates = placeholders[0].items;
    const updatedTooltips = [...tooltips];
    const label = labels[0];
    let colorData = {}, gradientOptions = null, sizeMinValue, sizeMaxValue, leftBot, rightTop;
    const colorDictionary = {};
    const getTooltip = (dataTitle) => updatedTooltips.find((tooltip) => dataTitle === tooltip.title);
    // we get the min and max for the radius, as well as the gradient values
    if (size || color) {
        data.forEach((values) => {
            values.forEach((columnData, columnIndex) => {
                if (columnData === 'null' || columnData === null) {
                    return;
                }
                const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
                if (size && size.title === dataTitle) {
                    const value = Number(columnData);
                    [sizeMinValue, sizeMaxValue] = (0, geo_helpers_1.getExtremeValues)({
                        min: sizeMinValue,
                        max: sizeMaxValue,
                        value,
                    });
                }
                if (color && color.title === dataTitle) {
                    const colorValue = Number(columnData);
                    if (!isNaN(colorValue)) {
                        colorValues.push(colorValue);
                    }
                }
            });
        });
    }
    let mountedColors = {};
    let paletteColors = [];
    if (gradientMode) {
        const gradientThresholdValues = (0, color_helpers_1.getThresholdValues)(colorsConfig, colorValues);
        const { min, rangeMiddle, max } = gradientThresholdValues;
        colorData = (0, color_helpers_1.getColorsByMeasureField)({
            values: colorValues,
            colorsConfig,
            gradientThresholdValues,
        });
        gradientOptions = {
            min: min,
            mid: min + rangeMiddle,
            max: max,
        };
    }
    else {
        const colorSettings = (0, color_palettes_1.getColorsSettings)({
            field: color,
            colorsConfig,
            defaultColorPaletteId,
            availablePalettes: colorsConfig.availablePalettes,
            customColorPalettes: colorsConfig.loadedColorPalettes,
        });
        mountedColors = colorSettings.mountedColors;
        paletteColors = colorSettings.colors;
    }
    let colorIndex = -1;
    if (color) {
        const cTitle = idToTitle[color.guid];
        colorIndex = (0, misc_helpers_1.findIndexInOrder)(order, color, cTitle);
    }
    const colorsByValue = new Map();
    data.forEach((values, valuesIndex) => {
        // at each pass of the string, we collect the points into an array, assuming,
        // that there can be more than one pair of coordinates in a row
        allPoints[`points-${valuesIndex}`] = [];
        const actionParams = {};
        // eslint-disable-next-line complexity
        values.forEach((columnData, columnIndex) => {
            if (columnData === 'null' || columnData === null) {
                return;
            }
            const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
            if (coordinates.findIndex(({ title }) => title === dataTitle) !== -1) {
                const current = JSON.parse(columnData);
                // adjusting the borders of the map
                [leftBot, rightTop] = (0, geo_helpers_1.getMapBounds)({ leftBot, rightTop, current });
                allPoints[`points-${valuesIndex}`].push(getPointConfig({
                    columnIndex,
                    stringifyedCoordinates: columnData,
                    geopointsConfig,
                }));
            }
            if (size && size.title === dataTitle) {
                const radius = (0, misc_helpers_1.getPointRadius)({
                    current: Number(columnData),
                    min: sizeMinValue,
                    max: sizeMaxValue,
                    geopointsConfig,
                });
                allPoints[`points-${valuesIndex}`].forEach((point) => setPointProperty({
                    point,
                    propName: 'radius',
                    propValue: radius,
                }));
            }
            if (label && label.title === dataTitle) {
                const formatting = (0, shared_1.getFormatOptions)(label);
                allPoints[`points-${valuesIndex}`].forEach((point) => setPointProperty({
                    point,
                    propName: 'label',
                    propValue: columnData,
                    propType: label.data_type,
                    formatting,
                }));
            }
            if (color && color.title === dataTitle) {
                const colorValue = (0, escape_1.default)(values[colorIndex]);
                let iconColor = constants_2.DEFAULT_ICON_COLOR;
                if (colorValue) {
                    if (gradientMode) {
                        const key = isNaN(Number(colorValue))
                            ? colorValue
                            : String(Number(colorValue));
                        if (colorData[key]) {
                            iconColor = colorData[key];
                        }
                    }
                    else {
                        let mountedColor = (0, constants_1.getMountedColor)({
                            colors: paletteColors,
                            mountedColors,
                            value: colorValue,
                        });
                        if (!mountedColor || mountedColor === 'auto') {
                            if (!colorsByValue.has(colorValue)) {
                                const key = colorsConfig.colors[colorsByValue.size % colorsConfig.colors.length];
                                colorsByValue.set(colorValue, key);
                            }
                            mountedColor = colorsByValue.get(colorValue) || constants_2.DEFAULT_ICON_COLOR;
                        }
                        iconColor = mountedColor;
                        colorDictionary[colorValue] = mountedColor;
                    }
                }
                allPoints[`points-${valuesIndex}`].forEach((point) => {
                    point.options.iconColor = iconColor;
                });
            }
            const tooltipField = tooltips.length
                ? getTooltip(dataTitle)
                : undefined;
            if (tooltipField) {
                // Due to the fact that a field that already exists in another section can be installed in a section with a tooltip,
                // it (the field in the tooltip and other section) comes to the order array in a single instance,
                // which in turn can lead to an incorrect order of displaying fields in the tooltip.
                // Therefore, before installing the tooltip, we remember its correct index
                const index = updatedTooltips.findIndex((t) => t.title === dataTitle);
                const shouldUseFieldTitle = (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.fieldTitle) !== 'off';
                const itemTitle = shouldUseFieldTitle ? (0, shared_1.getFakeTitleOrTitle)(tooltipField) : '';
                const pointData = {};
                if ((0, shared_1.isMarkupDataType)(tooltipField.data_type)) {
                    pointData.key = itemTitle;
                    pointData.value = columnData;
                }
                else {
                    const tooltipFieldFormatting = (0, shared_1.getFormatOptions)(tooltipField);
                    const value = prepareValue(columnData, tooltipField.data_type, tooltipFieldFormatting);
                    const text = itemTitle ? `${itemTitle}: ${value}` : value;
                    switch (tooltipField === null || tooltipField === void 0 ? void 0 : tooltipField.markupType) {
                        case shared_1.MARKUP_TYPE.markdown: {
                            pointData[shared_1.WRAPPED_MARKDOWN_KEY] = text;
                            break;
                        }
                        case shared_1.MARKUP_TYPE.html: {
                            pointData.text = (0, ui_sandbox_1.wrapHtml)(text);
                            break;
                        }
                        default: {
                            pointData.text = text;
                            break;
                        }
                    }
                }
                allPoints[`points-${valuesIndex}`].forEach((point) => {
                    if (!point) {
                        return;
                    }
                    if (!point.feature.properties.data) {
                        point.feature.properties.data = [];
                    }
                    if (index === 0 && (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.color) !== 'off') {
                        pointData.color = point.options.iconColor;
                    }
                    point.feature.properties.data[index] = pointData;
                });
                (0, action_params_1.addActionParamValue)(actionParams, tooltipField, columnData);
            }
            if (isActionParamsEnabled) {
                allPoints[`points-${valuesIndex}`].forEach((point) => {
                    (0, set_1.default)(point, 'feature.properties.custom.actionParams', actionParams);
                });
            }
        });
    });
    if (tooltips.some((item) => item.markupType === shared_1.MARKUP_TYPE.markdown)) {
        ChartEditor.updateConfig({ useMarkdown: true });
    }
    if (tooltips.some((item) => item.markupType === shared_1.MARKUP_TYPE.html)) {
        ChartEditor.updateConfig({ useHtml: true });
    }
    let mapOptions = {
        opacity: ALPHA,
        showCustomLegend: true,
    };
    if (shared.extraSettings && shared.extraSettings.legendMode === 'hide') {
        mapOptions.showCustomLegend = false;
    }
    if (layerSettings.id) {
        mapOptions.geoObjectId = layerSettings.id;
    }
    mapOptions.layerTitle =
        layerSettings.name || ChartEditor.getTranslation('wizard.prepares', 'label_new-layer');
    if (size) {
        mapOptions = {
            ...mapOptions,
            sizeMinValue,
            sizeMaxValue,
            sizeTitle: size.fakeTitle || idToTitle[size.guid] || size.title,
        };
    }
    const shouldSetBounds = ((_b = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _b === void 0 ? void 0 : _b.zoomMode) !== shared_1.ZoomMode.Manual &&
        ((_c = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _c === void 0 ? void 0 : _c.mapCenterMode) !== shared_1.ZoomMode.Manual;
    const { zoom, center } = (0, geo_helpers_1.getMapState)(shared, [leftBot, rightTop]);
    ChartEditor === null || ChartEditor === void 0 ? void 0 : ChartEditor.updateHighchartsConfig({ state: { zoom, center } });
    if (gradientOptions) {
        const colorTitle = color.fakeTitle || idToTitle[color.guid] || color.title;
        mapOptions = {
            ...mapOptions,
            ...(0, geo_helpers_1.getGradientMapOptions)(colorsConfig, colorTitle, gradientOptions),
        };
        const resultData = {
            collection: {
                children: (0, geo_helpers_1.getFlattenCoordinates)(Object.values(allPoints)),
            },
            options: mapOptions,
        };
        if (shouldSetBounds) {
            resultData.bounds = [leftBot, rightTop];
        }
        return [resultData];
    }
    else {
        mapOptions = {
            ...mapOptions,
        };
        if (color) {
            mapOptions.colorDictionary = colorDictionary;
            mapOptions.mode = 'dictionary';
            mapOptions.colorTitle = color.fakeTitle || idToTitle[color.guid] || color.title;
        }
    }
    const resultData = {
        options: mapOptions,
    };
    if (shouldSetBounds) {
        resultData.bounds = [leftBot, rightTop];
    }
    const flatternCoordinates = (0, geo_helpers_1.getFlattenCoordinates)(Object.values(allPoints));
    if (isClusteredPoints) {
        return [
            {
                ...resultData,
                clusterer: flatternCoordinates,
                options: {
                    ...resultData.options,
                    clusterIconLayout: 'default#pieChart',
                    iconPieChartCoreRadius: 15,
                    iconPieChartRadius: 20,
                    iconPieChartStrokeWidth: 1,
                    hasBalloon: false,
                    margin: 20,
                },
            },
        ];
    }
    return [
        {
            ...resultData,
            collection: {
                children: flatternCoordinates,
            },
        },
    ];
}
exports.default = prepareGeopoint;
