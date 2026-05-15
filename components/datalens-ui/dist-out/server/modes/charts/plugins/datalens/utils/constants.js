"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLOR_SHAPE_SEPARATOR = exports.PSEUDO = exports.GEO_MAP_LAYERS_LEVEL = exports.DEFAULT_MAX_POINT_RADIUS = exports.DEFAULT_MIN_POINT_RADIUS = exports.SORT_ORDER = exports.getMountedColor = exports.getColor = exports.DATASET_DATA_PIVOT_URL = exports.DATASET_DATA_URL_V2 = exports.DATASET_DATA_URL_V1 = exports.SERVER_DATETIME_FORMAT = exports.SERVER_DATE_FORMAT = exports.DEFAULT_DATETIMETZ_FORMAT = exports.DEFAULT_DATETIME_FORMAT = exports.DEFAULT_DATE_FORMAT = exports.LONG = exports.LAT = exports.LOG_INFO = exports.LOG_TIMING = void 0;
const shared_1 = require("../../../../../../shared");
exports.LOG_TIMING = 'process' in globalThis && (0, shared_1.isTrueArg)(process.env.SHOW_CHARTS_LOG_TIMING);
exports.LOG_INFO = 'process' in globalThis && (0, shared_1.isTrueArg)(process.env.SHOW_CHARTS_LOG);
exports.LAT = 0;
exports.LONG = 1;
exports.DEFAULT_DATE_FORMAT = 'DD.MM.YYYY';
exports.DEFAULT_DATETIME_FORMAT = 'DD.MM.YYYY HH:mm:ss';
exports.DEFAULT_DATETIMETZ_FORMAT = 'DD.MM.YYYY HH:mm:ss Z';
exports.SERVER_DATE_FORMAT = 'YYYY-MM-DD';
exports.SERVER_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
exports.DATASET_DATA_URL_V1 = '/_bi/api/data/v1.5/datasets/{id}/result';
exports.DATASET_DATA_URL_V2 = '/_bi_datasets/{id}/result';
exports.DATASET_DATA_PIVOT_URL = '/_bi_datasets/{id}/pivot';
const getColor = (colorIndex, colors) => {
    const index = colorIndex % colors.length;
    return colors[index];
};
exports.getColor = getColor;
const getMountedColor = ({ mountedColors = {}, colors, value, }) => {
    const color = mountedColors[value];
    return isNaN(Number(color)) ? color : (0, exports.getColor)(Number(color), colors);
};
exports.getMountedColor = getMountedColor;
exports.SORT_ORDER = {
    ASCENDING: {
        NUM: 1,
        STR: 'ASC',
    },
    DESCENDING: {
        NUM: -1,
        STR: 'DESC',
    },
};
exports.DEFAULT_MIN_POINT_RADIUS = 2;
exports.DEFAULT_MAX_POINT_RADIUS = 8;
// Heatmap does not support zIndex. Always located at the bottom;
exports.GEO_MAP_LAYERS_LEVEL = {
    GEOPOINT: 3,
    POLYLINE: 2,
    POLYGON: 1,
};
exports.PSEUDO = 'PSEUDO';
exports.COLOR_SHAPE_SEPARATOR = '__COLOR_SHAPE_SEPARATOR__';
