"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorizeGeoByPalette = colorizeGeoByPalette;
exports.getMapState = getMapState;
exports.getMapBounds = getMapBounds;
exports.getExtremeValues = getExtremeValues;
exports.getFlattenCoordinates = getFlattenCoordinates;
exports.colorizeGeoByGradient = colorizeGeoByGradient;
exports.getLayerAlpha = getLayerAlpha;
exports.getGradientMapOptions = getGradientMapOptions;
const shared_1 = require("../../../../../../shared");
const color_palettes_1 = require("../../helpers/color-palettes");
const color_helpers_1 = require("./color-helpers");
const constants_1 = require("./constants");
function getMapBounds(points) {
    const { current } = points;
    const currentLat = (current[constants_1.LAT] = current[constants_1.LAT] < -90 ? current[constants_1.LAT] + 180 : current[constants_1.LAT]);
    // -168 - Bering Strait
    const currentLong = (current[constants_1.LONG] =
        current[constants_1.LONG] < -168 ? current[constants_1.LONG] + 360 : current[constants_1.LONG]);
    let leftBot, rightTop;
    if (points.leftBot) {
        leftBot = [...points.leftBot];
    }
    else {
        leftBot = [currentLat, currentLong];
    }
    if (points.rightTop) {
        rightTop = [...points.rightTop];
    }
    else {
        rightTop = [currentLat, currentLong];
    }
    if (currentLat < leftBot[constants_1.LAT]) {
        leftBot[constants_1.LAT] = currentLat;
    }
    if (currentLong < leftBot[constants_1.LONG]) {
        leftBot[constants_1.LONG] = currentLong;
    }
    if (currentLat > rightTop[constants_1.LAT]) {
        rightTop[constants_1.LAT] = currentLat;
    }
    if (currentLong > rightTop[constants_1.LONG]) {
        rightTop[constants_1.LONG] = currentLong;
    }
    // -85 is the maximum latitude value to which Yandex maps draw, then the south pole is displayed as a gray zone.
    if (leftBot[constants_1.LAT] < -85) {
        leftBot[constants_1.LAT] = -85;
    }
    return [leftBot, rightTop];
}
function getExtremeValues(params) {
    const { value } = params;
    let min, max;
    if (params.min) {
        min = params.min;
    }
    else {
        min = value;
    }
    if (params.max) {
        max = params.max;
    }
    else {
        max = value;
    }
    if (value < min) {
        min = value;
    }
    if (value > max) {
        max = value;
    }
    return [min, max];
}
function getFlattenCoordinates(coordinates) {
    return coordinates.reduce((acc, val) => acc.concat(val), []);
}
function colorizeGeoByGradient(data, colorsConfig) {
    const preparedData = Object.entries(data).reduce((acc, [, points]) => {
        points.forEach((point) => {
            Object.assign(acc, point);
        });
        return acc;
    }, {});
    return (0, color_helpers_1.mapAndColorizeHashTableByGradient)(preparedData, colorsConfig);
}
function colorizeGeoByPalette({ data, colorsConfig, colorField, defaultColorPaletteId, }) {
    const preparedData = Object.entries(data).reduce((acc, [, points]) => {
        points.forEach((point) => {
            if (typeof point === 'object' && point !== null) {
                Object.assign(acc, point);
            }
        });
        return acc;
    }, {});
    const knownValues = [];
    const colorData = {};
    const colorDictionary = {};
    const { mountedColors, colors } = (0, color_palettes_1.getColorsSettings)({
        field: colorField,
        colorsConfig,
        defaultColorPaletteId,
        availablePalettes: colorsConfig.availablePalettes,
        customColorPalettes: colorsConfig.loadedColorPalettes,
    });
    // eslint-disable-next-line guard-for-in
    for (const point in preparedData) {
        const value = preparedData[point];
        colorData[point] = {};
        let colorIndex = knownValues.findIndex(({ value: knownValue }) => knownValue === value);
        if (colorIndex === -1) {
            knownValues.push({ point, value });
            colorIndex = knownValues.length - 1;
            let color;
            if (mountedColors && mountedColors[value]) {
                color = (0, constants_1.getMountedColor)({ mountedColors, colors, value });
            }
            else {
                color = (0, constants_1.getColor)(colorIndex, colors);
            }
            knownValues[knownValues.length - 1].backgroundColor = color;
            colorData[point].backgroundColor = color;
            colorDictionary[value] = color;
        }
        else {
            colorData[point].backgroundColor = knownValues[colorIndex].backgroundColor;
        }
        colorData[point].colorIndex = colorIndex;
    }
    return { colorData, colorDictionary: (0, shared_1.getSortedData)(colorDictionary) };
}
function getLayerAlpha(layerSettings) {
    return layerSettings.alpha * 1e-2 || 0.8;
}
function getGradientMapOptions(colorsConfig, colorTitle, colorizedResult) {
    const rawGradientData = (0, color_helpers_1.getCurrentGradient)(colorsConfig);
    const rgbColors = (0, color_helpers_1.getRgbColors)(rawGradientData.colors, Boolean(colorsConfig.reversed));
    const gradientData = {
        ...rawGradientData,
        colors: rgbColors,
    };
    const mapOptions = {
        mode: 'gradient',
        colorTitle,
        gradientData,
        colorMinValue: colorizedResult.min,
        colorMaxValue: colorizedResult.max,
    };
    if (colorsConfig.gradientMode === '3-point') {
        mapOptions.colorMidValue = colorizedResult.mid;
    }
    return mapOptions;
}
function getMapState(shared, bounds) {
    var _a, _b, _c, _d, _e, _f;
    const [leftBot, rightTop] = bounds;
    const shouldSetBounds = ((_a = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _a === void 0 ? void 0 : _a.zoomMode) !== shared_1.ZoomMode.Manual &&
        ((_b = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _b === void 0 ? void 0 : _b.mapCenterMode) !== shared_1.ZoomMode.Manual;
    let center = [55.76, 37.64];
    const centerValue = (_c = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _c === void 0 ? void 0 : _c.mapCenterValue;
    const mapCenterValue = centerValue ? (0, shared_1.mapStringToCoordinates)(centerValue) : null;
    if (((_d = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _d === void 0 ? void 0 : _d.mapCenterMode) === shared_1.MapCenterMode.Manual && mapCenterValue) {
        center = mapCenterValue;
    }
    else if (leftBot && rightTop && !shouldSetBounds) {
        center = [leftBot[0] / 2 + rightTop[0] / 2, leftBot[1] / 2 + rightTop[1] / 2];
    }
    let zoom = 8;
    if (((_e = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _e === void 0 ? void 0 : _e.zoomMode) === shared_1.ZoomMode.Manual && ((_f = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _f === void 0 ? void 0 : _f.zoomValue)) {
        zoom = Math.max(1, shared.extraSettings.zoomValue);
    }
    return { zoom, center };
}
