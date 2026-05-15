"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../shared");
const constants_1 = require("../utils/constants");
const geo_helpers_1 = require("../utils/geo-helpers");
const misc_helpers_1 = require("../utils/misc-helpers");
const DEFAULT_GROUP = 'DEFAULT_GROUP';
const getFieldData = (fields, dataRow, order, idToTitle) => {
    return fields.reduce((acc, measureField) => {
        const labelTitle = measureField.title || idToTitle[measureField.guid];
        const index = (0, misc_helpers_1.findIndexInOrder)(order, measureField, labelTitle);
        if (index !== -1) {
            acc.push({
                title: labelTitle,
                value: dataRow[index],
            });
        }
        return acc;
    }, []);
};
const preparePolyline = (options) => {
    var _a, _b;
    const { shared, defaultColorPaletteId, ChartEditor } = options;
    const i18n = (key, params) => ChartEditor.getTranslation('wizard.prepares', key, params);
    const { idToDataType } = options;
    const { data, order } = options.resultData;
    const [color] = options.colors;
    const colorsConfig = options.colorsConfig;
    const colorFieldDataType = color ? idToDataType[color.guid] : null;
    const gradientMode = color &&
        colorFieldDataType &&
        (0, misc_helpers_1.isGradientMode)({ colorField: color, colorFieldDataType, colorsConfig });
    const ALPHA = (0, geo_helpers_1.getLayerAlpha)(options.layerSettings || {});
    let leftBot;
    let rightTop;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const groupingFields = options.placeholders.find((placeholder) => placeholder.id === 'grouping').items;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const measures = options.placeholders.find((placeholder) => placeholder.id === 'measures').items;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const polylinePlaceholder = options.placeholders.find((placeholder) => placeholder.id === 'polyline');
    const [polylineField] = polylinePlaceholder.items;
    const sort = options.sort;
    const [sortField] = sort;
    const showPoints = polylinePlaceholder.settings.polylinePoints === 'on';
    const groups = data.reduce((acc, dataRow) => {
        const point = JSON.parse(dataRow[0]);
        if (point === null) {
            return acc;
        }
        const groupingObjects = getFieldData(groupingFields, dataRow, order, options.idToTitle);
        [leftBot, rightTop] = (0, geo_helpers_1.getMapBounds)({
            leftBot,
            rightTop,
            current: point,
        });
        const group = groupingObjects.map((item) => `${item.title}: ${item.value}`).join(', ');
        if (!acc[group || DEFAULT_GROUP]) {
            acc[group || DEFAULT_GROUP] = [];
        }
        acc[group || DEFAULT_GROUP].push(dataRow);
        return acc;
    }, {});
    const children = [];
    let colorData;
    if (color) {
        // CHARTS-1961
        const hashTable = data.reduce((acc, dataRow, valuesIndex) => {
            const colorsObjects = getFieldData(options.colors, dataRow, order, options.idToTitle);
            acc[`points-${valuesIndex}`] = colorsObjects.map((el) => {
                return {
                    [String(el.value)]: el.value,
                };
            });
            return acc;
        }, {});
        if (gradientMode) {
            colorData = (0, geo_helpers_1.colorizeGeoByGradient)(hashTable, colorsConfig).colorData;
        }
        else {
            colorData = (0, geo_helpers_1.colorizeGeoByPalette)({
                data: hashTable,
                colorsConfig,
                colorField: color,
                defaultColorPaletteId,
            }).colorData;
        }
    }
    const mapOptions = {
        opacity: ALPHA,
    };
    if (options.layerSettings.id) {
        mapOptions.geoObjectId = options.layerSettings.id;
    }
    Object.entries(groups).forEach(([groupName, groupDataRows]) => {
        const mappedRowData = groupDataRows.reduce((acc, row) => {
            const coords = getFieldData([polylineField], row, order, options.idToTitle)[0];
            let sortData;
            if (sortField) {
                sortData = getFieldData(sort, row, order, options.idToTitle)[0];
                if ((0, shared_1.isDateField)(sortField)) {
                    sortData.value = (0, misc_helpers_1.formatDate)({
                        valueType: sortField.data_type,
                        value: sortData.value,
                        format: sortField.format,
                    });
                }
            }
            const colorsObjects = getFieldData(options.colors, row, order, options.idToTitle);
            acc.push({
                coords: {
                    title: coords.title,
                    value: JSON.parse(String(coords.value)),
                },
                measures: getFieldData(measures, row, order, options.idToTitle),
                sort: sortData,
                color: colorsObjects[0],
            });
            return acc;
        }, []);
        for (let i = 1; i < mappedRowData.length; i++) {
            const prev = mappedRowData[i - 1];
            const current = mappedRowData[i];
            const color = colorData && prev.color && colorData[String(prev.color.value)].backgroundColor;
            const tooltipData = [];
            if (groupName !== DEFAULT_GROUP) {
                tooltipData.push({
                    text: i18n('label_line', { value: groupName }),
                });
            }
            tooltipData.push({
                text: i18n('label_segment', {
                    value: `${prev.coords.value} → ${current.coords.value}`,
                }),
            });
            if (prev.sort && current.sort) {
                tooltipData.push({
                    text: i18n('label_order', {
                        value: `${prev.sort.value} → ${current.sort.value}`,
                    }),
                });
            }
            if (color && prev.color) {
                tooltipData.push({
                    color,
                    text: i18n('label_color', {
                        value: `${prev.color.title}: ${prev.color.value}`,
                    }),
                });
            }
            tooltipData.push(...prev.measures.map((measure, index) => {
                const currentMeasure = current.measures[index];
                return {
                    text: `${measure.title}: ${measure.value} → ${currentMeasure.value}`,
                };
            }));
            children.push({
                feature: {
                    geometry: {
                        type: 'LineString',
                        coordinates: [prev.coords.value, current.coords.value],
                    },
                    properties: {
                        data: tooltipData,
                    },
                },
                options: {
                    strokeWidth: 6,
                    strokeColor: colorData &&
                        prev.color &&
                        colorData[String(prev.color.value)].backgroundColor,
                    zIndex: constants_1.GEO_MAP_LAYERS_LEVEL.POLYLINE,
                },
            });
        }
        if (showPoints) {
            mappedRowData.forEach((item) => {
                const tooltipData = [];
                tooltipData.push({
                    text: i18n('label_point', { value: item.coords.value }),
                });
                if (groupName !== DEFAULT_GROUP) {
                    tooltipData.push({
                        text: i18n('label_line', { value: groupName }),
                    });
                }
                if (colorData && item.color) {
                    tooltipData.push({
                        color: colorData[String(item.color.value)].backgroundColor,
                        text: i18n('label_color', {
                            value: `${item.color.title}: ${item.color.value}`,
                        }),
                    });
                }
                tooltipData.push(...item.measures.map((item) => {
                    return {
                        text: `${item.title}: ${item.value}`,
                    };
                }));
                children.push({
                    feature: {
                        geometry: {
                            type: 'Point',
                            coordinates: item.coords.value,
                        },
                        properties: {
                            radius: 1.5,
                            data: tooltipData,
                        },
                    },
                    options: {
                        preset: 'chartkit#chips',
                        iconColor: colorData &&
                            item.color &&
                            colorData[String(item.color.value)].backgroundColor,
                    },
                });
            });
        }
    });
    const shouldSetBounds = ((_a = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _a === void 0 ? void 0 : _a.zoomMode) !== shared_1.ZoomMode.Manual &&
        ((_b = shared === null || shared === void 0 ? void 0 : shared.extraSettings) === null || _b === void 0 ? void 0 : _b.mapCenterMode) !== shared_1.ZoomMode.Manual;
    const { zoom, center } = (0, geo_helpers_1.getMapState)(shared, [leftBot, rightTop]);
    ChartEditor === null || ChartEditor === void 0 ? void 0 : ChartEditor.updateHighchartsConfig({ state: { zoom, center } });
    return [
        {
            collection: {
                children,
            },
            options: mapOptions,
            bounds: shouldSetBounds ? [leftBot, rightTop] : undefined,
        },
    ];
};
exports.default = preparePolyline;
