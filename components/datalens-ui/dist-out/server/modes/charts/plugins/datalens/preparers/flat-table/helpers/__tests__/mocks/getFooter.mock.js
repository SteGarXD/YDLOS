"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER = exports.TOTALS = exports.ID_TO_DATA_TYPE = exports.ID_TO_TITLE = exports.COLUMNS_WITH_DUPLICATES = exports.COLUMNS = void 0;
exports.COLUMNS = [
    {
        type: 'DIMENSION',
        data_type: 'string',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
    {
        type: 'MEASURE',
        data_type: 'integer',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
];
exports.COLUMNS_WITH_DUPLICATES = [
    {
        type: 'DIMENSION',
        data_type: 'string',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
    {
        type: 'MEASURE',
        data_type: 'integer',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
    {
        type: 'MEASURE',
        data_type: 'integer',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
    {
        type: 'DIMENSION',
        data_type: 'string',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        calc_mode: 'direct',
        datasetId: 'lmsaoq5u6m2qd',
    },
];
exports.ID_TO_TITLE = {
    'ac8dd226-3372-4212-bde7-17afc792a728': 'Category',
    '4b6463d1-30e1-425e-b7d2-77205bc75de6': 'Profit',
};
exports.ID_TO_DATA_TYPE = {
    'ac8dd226-3372-4212-bde7-17afc792a728': 'string',
    '4b6463d1-30e1-425e-b7d2-77205bc75de6': 'integer',
};
exports.TOTALS = ['', '282070'];
exports.ORDER = [
    {
        datasetId: 'lmsaoq5u6m2qd',
        title: 'Category',
    },
    {
        datasetId: 'lmsaoq5u6m2qd',
        title: 'Profit',
    },
];
