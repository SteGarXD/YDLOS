"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const color_helpers_1 = require("../utils/color-helpers");
const geo_helpers_1 = require("../utils/geo-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
function prepareHeatmap(options) {
    var _a, _b, _c;
    const { placeholders, colors, resultData: { data, order }, idToTitle, shared, colorsConfig, ChartEditor, } = options;
    const layerSettings = (options.layerSettings ||
        {});
    const allPoints = {};
    const coordinates = placeholders[0].items;
    let min, max, leftBot, rightTop;
    if (colors.length) {
        data.forEach((values) => {
            values.forEach((columnData, columnIndex) => {
                if (columnData === 'null' || columnData === null) {
                    return;
                }
                const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
                if (colors[0].title === dataTitle) {
                    const value = Number(columnData);
                    [min, max] = (0, geo_helpers_1.getExtremeValues)({ min, max, value });
                }
            });
        });
    }
    // we get a step for the weight parameter (we distribute points from 1 to 10)
    const step = (max - min) / 10;
    const getPointConfig = (coordinates) => {
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates,
            },
            properties: {
                weight: 5,
            },
        };
    };
    const getPointWeight = ({ current, min, step }) => {
        return Math.ceil((current - min) / step);
    };
    const setPointWeight = (point, weight) => {
        if (!point) {
            return;
        }
        point.properties.weight = weight ? weight : 1;
    };
    const colorValues = [];
    data.forEach((values, valuesIndex) => {
        allPoints[`points-${valuesIndex}`] = [];
        values.forEach((columnData, columnIndex) => {
            if (columnData === 'null' || columnData === null) {
                return;
            }
            const dataTitle = (0, misc_helpers_1.getTitleInOrder)(order, columnIndex, coordinates);
            if (coordinates.findIndex(({ title }) => title === dataTitle) !== -1) {
                const current = JSON.parse(columnData);
                [leftBot, rightTop] = (0, geo_helpers_1.getMapBounds)({ leftBot, rightTop, current });
                allPoints[`points-${valuesIndex}`].push(getPointConfig(current));
            }
            if (colors.length && colors[0].title === dataTitle) {
                const weight = getPointWeight({ current: Number(columnData), min, step });
                colorValues.push(weight);
                allPoints[`points-${valuesIndex}`].forEach((point) => setPointWeight(point, weight));
            }
        });
    });
    const isCustomPalette = Boolean(colors.length && ((_a = colorsConfig.gradientColors) === null || _a === void 0 ? void 0 : _a.length));
    let middleThreshold = 0.2;
    let gradient = {
        0.1: 'rgba(128, 255, 0, 0.7)',
        0.2: 'rgba(255, 255, 0, 0.8)',
        0.7: 'rgba(234, 72, 58, 0.9)',
        1.0: 'rgba(162, 36, 25, 1)',
    };
    if (isCustomPalette) {
        const currentGradient = (0, color_helpers_1.getCurrentGradient)(colorsConfig);
        const rgbColors = (0, color_helpers_1.getRgbColors)(currentGradient.colors, Boolean(colorsConfig.reversed));
        const [first, second, third] = rgbColors;
        if (first && second && third) {
            const hasMiddleThreValue = Boolean(colorsConfig.thresholdsMode === 'manual' &&
                colorsConfig.middleThreshold !== 'undefined');
            if (hasMiddleThreValue) {
                const { range, rangeMiddle } = (0, color_helpers_1.getThresholdValues)(colorsConfig, colorValues);
                middleThreshold = rangeMiddle / range;
            }
            gradient = {
                '0': `rgba(${first.red}, ${first.green}, ${first.blue}, 0.7)`,
                '0.5': `rgba(${second.red}, ${second.green}, ${second.blue}, 0.9)`,
                '1': `rgba(${third.red}, ${third.green}, ${third.blue}, 1)`,
            };
        }
        else if (first && second) {
            gradient = {
                '0': `rgba(${first.red}, ${first.green}, ${first.blue}, 0.7)`,
                '1': `rgba(${second.red}, ${second.green}, ${second.blue}, 1)`,
            };
        }
    }
    const mapOptions = {
        radius: 15,
        dissipating: false,
        opacity: (0, geo_helpers_1.getLayerAlpha)(layerSettings),
        intensityOfMidpoint: middleThreshold,
        gradient,
        isCustomPalette: isCustomPalette,
        showCustomLegend: true,
        colorTitle: coordinates[0].fakeTitle || idToTitle[coordinates[0].guid] || coordinates[0].title,
    };
    if (shared.extraSettings && shared.extraSettings.legendMode === 'hide') {
        mapOptions.showCustomLegend = false;
    }
    if (layerSettings.id) {
        mapOptions.geoObjectId = layerSettings.id;
    }
    mapOptions.layerTitle =
        layerSettings.name ||
            options.ChartEditor.getTranslation('wizard.prepares', 'label_new-layer');
    const shouldSetBounds = ((_b = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _b === void 0 ? void 0 : _b.zoomMode) !== shared_1.ZoomMode.Manual &&
        ((_c = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _c === void 0 ? void 0 : _c.mapCenterMode) !== shared_1.ZoomMode.Manual;
    const { zoom, center } = (0, geo_helpers_1.getMapState)(shared, [leftBot, rightTop]);
    ChartEditor === null || ChartEditor === void 0 ? void 0 : ChartEditor.updateHighchartsConfig({ state: { zoom, center } });
    return [
        {
            heatmap: (0, geo_helpers_1.getFlattenCoordinates)(Object.values(allPoints)),
            options: mapOptions,
            bounds: shouldSetBounds ? [leftBot, rightTop] : undefined,
        },
    ];
}
exports.default = prepareHeatmap;
