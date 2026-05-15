"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const set_1 = __importDefault(require("lodash/set"));
const shared_1 = require("../../../../../../shared");
const ui_sandbox_1 = require("../../../../../../shared/utils/ui-sandbox");
const color_helpers_1 = require("../utils/color-helpers");
const constants_1 = require("../utils/constants");
const geo_helpers_1 = require("../utils/geo-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
const action_params_1 = require("./helpers/action-params");
function prepareFormattedValue(args) {
    const { dataType, formatting, value } = args;
    if (dataType && (0, misc_helpers_1.isNumericalDataType)(dataType)) {
        return (0, misc_helpers_1.chartKitFormatNumberWrapper)(Number(value), {
            lang: 'ru',
            ...(formatting !== null && formatting !== void 0 ? formatting : {
                precision: dataType === 'float' ? shared_1.MINIMUM_FRACTION_DIGITS : 0,
            }),
        });
    }
    return value;
}
// eslint-disable-next-line complexity
function prepareGeopolygon(options) {
    var _a, _b, _c;
    const DEFAULT_COLOR = 'rgb(77, 162, 241)';
    const { colors, colorsConfig, tooltips, tooltipConfig, placeholders, resultData: { data, order }, idToTitle, shared, idToDataType, ChartEditor, defaultColorPaletteId, } = options;
    const widgetConfig = ChartEditor.getWidgetConfig();
    const isActionParamsEnabled = (_a = widgetConfig === null || widgetConfig === void 0 ? void 0 : widgetConfig.actionParams) === null || _a === void 0 ? void 0 : _a.enable;
    const layerSettings = (options.layerSettings ||
        {});
    const allPolygons = {};
    const hashTable = {};
    const color = colors[0];
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const coordinates = placeholders[0].items;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    let colorizedResult;
    let colorData = {}, leftBot, rightTop;
    let colorDictionary = {};
    const getPolygonConfig = ({ coordinates, colorData, columnIndex, key, }) => {
        const options = {};
        const properties = {};
        options.strokeColor = '#FFF';
        options.zIndex = constants_1.GEO_MAP_LAYERS_LEVEL.POLYGON;
        if (colorData && colorData[key]) {
            if (gradientMode) {
                options.fillColor = colorData[key].backgroundColor;
                options.fillColorDefault = colorData[key].backgroundColor;
                properties.colorIndex = colorData[key].value;
            }
            else {
                const { r, g, b } = (0, color_helpers_1.hexToRgb)(colorData[key].backgroundColor);
                options.fillColor = `rgb(${r}, ${g}, ${b})`;
                options.fillColorDefault = `rgb(${r}, ${g}, ${b})`;
                properties.colorIndex = colorData[key].colorIndex;
            }
            if (colorsConfig.polygonBorders === 'hide') {
                options.strokeWidth = 0;
            }
            options.iconColor = colorData[key] ? colorData[key].backgroundColor : DEFAULT_COLOR;
        }
        return {
            geometry: {
                type: 'Polygon',
                coordinates,
            },
            properties,
            options,
            columnIndex,
        };
    };
    const setPolygonTooltip = ({ polygon, text, tooltipIndex, }) => {
        if (!polygon) {
            return;
        }
        const tooltip = tooltips[tooltipIndex];
        const formatting = (0, shared_1.getFormatOptions)(tooltip);
        const formattedText = prepareFormattedValue({
            dataType: tooltip.data_type,
            formatting,
            value: text,
        });
        const shouldUseFieldTitle = (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.fieldTitle) !== 'off';
        const itemTitle = shouldUseFieldTitle ? (0, shared_1.getFakeTitleOrTitle)(tooltip) : '';
        const tooltipText = itemTitle ? `${itemTitle}: ${formattedText}` : formattedText;
        const isMarkupField = (tooltip === null || tooltip === void 0 ? void 0 : tooltip.data_type) === shared_1.DATASET_FIELD_TYPES.MARKUP;
        const useHtml = (0, shared_1.isHtmlField)(tooltip);
        if (isMarkupField || (0, shared_1.isMarkdownField)(tooltip) || useHtml) {
            polygon.properties.rawText = true;
        }
        if (useHtml) {
            ChartEditor.updateConfig({ useHtml: true });
        }
        let tooltipData;
        if (isMarkupField) {
            tooltipData = { key: itemTitle, value: formattedText };
        }
        else if ((tooltip === null || tooltip === void 0 ? void 0 : tooltip.markupType) === shared_1.MARKUP_TYPE.markdown) {
            tooltipData = { [shared_1.WRAPPED_MARKDOWN_KEY]: tooltipText };
        }
        else if ((tooltip === null || tooltip === void 0 ? void 0 : tooltip.markupType) === shared_1.MARKUP_TYPE.html) {
            tooltipData = { text: (0, ui_sandbox_1.wrapHtml)(tooltipText) };
        }
        else {
            tooltipData = { text: tooltipText };
        }
        if (gradientMode) {
            if (!polygon.properties.data) {
                polygon.properties.data = [];
            }
            if (!polygon.properties.data.some((entry) => entry.text === tooltipText)) {
                polygon.properties.data[tooltipIndex] = {
                    ...tooltipData,
                };
            }
        }
        else {
            if (!polygon.properties.data) {
                polygon.properties.data = [];
            }
            polygon.properties.data[tooltipIndex] = {
                ...tooltipData,
            };
        }
    };
    if (color) {
        data.forEach((values, valuesIndex) => {
            hashTable[`polygons-${valuesIndex}`] = [];
            values.forEach((columnData, columnIndex) => {
                if (columnData === 'null' || columnData === null) {
                    return;
                }
                const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
                if (coordinates.findIndex(({ title }) => title === dataTitle) !== -1) {
                    hashTable[`polygons-${valuesIndex}`].push(columnData);
                }
                if (color.title === dataTitle) {
                    hashTable[`polygons-${valuesIndex}`] = hashTable[`polygons-${valuesIndex}`].map((_coord, coordIndex) => {
                        return { [`polygons-${valuesIndex}-${coordIndex}`]: columnData };
                    });
                }
            });
        });
        if (gradientMode) {
            colorizedResult = (0, geo_helpers_1.colorizeGeoByGradient)(hashTable, colorsConfig);
            colorData = colorizedResult.colorData;
        }
        else {
            colorizedResult = (0, geo_helpers_1.colorizeGeoByPalette)({
                data: hashTable,
                colorsConfig,
                colorField: color,
                defaultColorPaletteId,
            });
            colorData = colorizedResult.colorData;
            colorDictionary = colorizedResult.colorDictionary;
        }
    }
    const getTooltipIndex = ({ tooltips, dataTitle, }) => {
        if (!tooltips || tooltips.length === 0) {
            return -1;
        }
        return tooltips.findIndex((tooltip) => tooltip.title === dataTitle);
    };
    data.forEach((values, valuesIndex) => {
        allPolygons[`polygons-${valuesIndex}`] = [];
        const polygons = allPolygons[`polygons-${valuesIndex}`];
        const actionParams = {};
        values.forEach((columnData, columnIndex) => {
            if (columnData === 'null' || columnData === null) {
                return;
            }
            const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
            if (coordinates.findIndex(({ title }) => title === dataTitle) !== -1) {
                const polygonCoordinates = JSON.parse(columnData);
                const flattenCoordinates = (0, geo_helpers_1.getFlattenCoordinates)(polygonCoordinates);
                // we go through the points of the polygon and adjust the boundaries of the map
                flattenCoordinates.forEach((current) => {
                    [leftBot, rightTop] = (0, geo_helpers_1.getMapBounds)({ leftBot, rightTop, current });
                });
                polygons.push(getPolygonConfig({
                    colorData,
                    columnIndex,
                    coordinates: polygonCoordinates,
                    key: `polygons-${valuesIndex}-${columnIndex}`,
                }));
            }
            const tooltipIndex = getTooltipIndex({ tooltips, dataTitle });
            const tooltipField = tooltips[tooltipIndex];
            if (tooltipIndex !== -1 && (polygons === null || polygons === void 0 ? void 0 : polygons.length) && tooltipField) {
                polygons.forEach((polygon) => {
                    setPolygonTooltip({
                        polygon,
                        text: columnData,
                        tooltipIndex,
                    });
                });
                if (tooltipIndex === 0 && (tooltipConfig === null || tooltipConfig === void 0 ? void 0 : tooltipConfig.color) !== 'off') {
                    polygons[0].properties.data[0].color =
                        polygons[0].options.iconColor || DEFAULT_COLOR;
                }
                (0, action_params_1.addActionParamValue)(actionParams, tooltipField, columnData);
            }
        });
        if (isActionParamsEnabled) {
            polygons.forEach((polygon) => {
                if (polygon) {
                    (0, set_1.default)(polygon, 'properties.custom.actionParams', actionParams);
                }
            });
        }
    });
    const polygons = {
        type: 'FeatureCollection',
        features: (0, geo_helpers_1.getFlattenCoordinates)(Object.values(allPolygons)).map((item) => {
            item.type = 'Feature';
            return item;
        }),
    };
    const fillOpacity = (0, geo_helpers_1.getLayerAlpha)(layerSettings);
    let fillOpacityHover = fillOpacity + 0.1;
    fillOpacityHover = fillOpacityHover > 1 ? 1 : fillOpacityHover;
    let mapOptions = {
        fillOpacity,
        fillOpacityHover,
        fillColorEmptyPolygon: DEFAULT_COLOR,
        strokeColorHover: '#FFF',
        strokeWidthHover: 2,
        showCustomLegend: true,
    };
    if (shared.extraSettings && shared.extraSettings.legendMode === 'hide') {
        mapOptions.showLegend = false;
        mapOptions.showCustomLegend = false;
    }
    if (layerSettings.id) {
        mapOptions.geoObjectId = layerSettings.id;
    }
    mapOptions.layerTitle =
        layerSettings.name ||
            options.ChartEditor.getTranslation('wizard.prepares', 'label_new-layer');
    if (colorsConfig.polygonBorders === 'hide') {
        mapOptions.strokeWidth = 0;
    }
    const shouldSetBounds = ((_b = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _b === void 0 ? void 0 : _b.zoomMode) !== shared_1.ZoomMode.Manual &&
        ((_c = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _c === void 0 ? void 0 : _c.mapCenterMode) !== shared_1.ZoomMode.Manual;
    const { zoom, center } = (0, geo_helpers_1.getMapState)(shared, [leftBot, rightTop]);
    ChartEditor === null || ChartEditor === void 0 ? void 0 : ChartEditor.updateHighchartsConfig({ state: { zoom, center } });
    if (gradientMode) {
        const colorTitle = color.fakeTitle || idToTitle[color.guid] || color.title;
        mapOptions = {
            ...mapOptions,
            ...(0, geo_helpers_1.getGradientMapOptions)(colorsConfig, colorTitle, colorizedResult),
        };
        return [
            {
                polygonmap: {
                    polygons,
                },
                options: mapOptions,
                bounds: shouldSetBounds ? [leftBot, rightTop] : undefined,
            },
        ];
    }
    else {
        if (color) {
            mapOptions = {
                ...mapOptions,
                colorDictionary,
                mode: 'dictionary',
                colorTitle: color.fakeTitle || idToTitle[color.guid] || color.title,
            };
        }
        return [
            {
                polygonmap: {
                    polygons,
                },
                options: mapOptions,
                bounds: shouldSetBounds ? [leftBot, rightTop] : undefined,
            },
        ];
    }
}
exports.default = prepareGeopolygon;
