"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREPARE_FUNCTION_ARGS = exports.MEASURE_COLOR_FIELD = exports.DIMENSION_COLOR_FIELD = exports.COORDINATES_FIELD = void 0;
const shared_1 = require("../../../../../../../../../shared");
const DATASET_ID = 'j43msj9o23ge9';
exports.COORDINATES_FIELD = {
    datasetId: DATASET_ID,
    title: 'CoordinatesField',
    guid: 'cddd9cad-52a2-4232-8898-ade9a972c864',
    data_type: shared_1.DATASET_FIELD_TYPES.GEOPOINT,
};
exports.DIMENSION_COLOR_FIELD = {
    datasetId: DATASET_ID,
    title: 'ColorField',
    guid: '38e0b1f4-d46b-48a0-8905-6a6d1e61900d',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
    type: 'DIMENSION',
};
exports.MEASURE_COLOR_FIELD = {
    datasetId: DATASET_ID,
    title: 'ColorField',
    guid: '38e0b1f4-d46b-48a0-8905-6a6d1e61900d',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
    type: 'MEASURE',
};
exports.PREPARE_FUNCTION_ARGS = {
    colors: [],
    colorsConfig: {
        loadedColorPalettes: {},
        colors: ['defaultColor', 'blue', 'red', 'orange'],
        gradientColors: [],
        availablePalettes: {
            custom: { id: 'custom', scheme: ['defaultColor', 'blue', 'red', 'orange'] },
        },
        palette: 'custom',
    },
    labels: [],
    tooltips: [],
    shared: {},
    placeholders: [
        {
            id: 'geopoint',
            items: [exports.COORDINATES_FIELD],
        },
        {
            id: 'size',
            items: [],
        },
    ],
    idToTitle: {
        [exports.COORDINATES_FIELD.guid]: exports.COORDINATES_FIELD.title,
        [exports.DIMENSION_COLOR_FIELD.guid]: exports.DIMENSION_COLOR_FIELD.title,
        [exports.MEASURE_COLOR_FIELD.guid]: exports.MEASURE_COLOR_FIELD.title,
    },
    idToDataType: {
        [exports.COORDINATES_FIELD.guid]: shared_1.DATASET_FIELD_TYPES.GEOPOINT,
        [exports.DIMENSION_COLOR_FIELD.guid]: shared_1.DATASET_FIELD_TYPES.STRING,
        [exports.MEASURE_COLOR_FIELD.guid]: shared_1.DATASET_FIELD_TYPES.STRING,
    },
    resultData: {
        data: [],
        order: [],
        totals: [],
    },
    ChartEditor: {
        getTranslation: (key) => key,
        getWidgetConfig: () => ({}),
        updateHighchartsConfig: () => { },
    },
    features: [],
};
