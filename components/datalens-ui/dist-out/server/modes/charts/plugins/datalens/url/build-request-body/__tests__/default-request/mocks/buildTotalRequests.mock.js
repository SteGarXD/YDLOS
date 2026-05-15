"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATASET_ID_2 = exports.DATASET_ID_1 = exports.COLUMNS_FOR_DATASET_ID_2 = exports.COLUMNS_FOR_DATASET_ID_1 = exports.COLUMNS_FOR_ORDER_TEST = exports.COLUMNS = exports.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST = exports.FIELDS_FOR_ORDER_TEST = exports.FIELDS = void 0;
exports.FIELDS = [
    {
        type: 'DIMENSION',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'MEASURE',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        datasetId: '4fnqsvsxtmcix',
    },
];
exports.FIELDS_FOR_ORDER_TEST = [
    {
        type: 'MEASURE',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'DIMENSION',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'MEASURE',
        guid: '809d03e1-15b7-4bdc-b108-653603a27001',
        title: 'Sales',
        datasetId: '4fnqsvsxtmcix',
    },
];
exports.FIELDS_WITH_DIFFERENT_DATASET_ID_TEST = [
    {
        type: 'DIMENSION',
        guid: 'ac8dd226-3372-4212-bde7-17afc792a728',
        title: 'Category',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'MEASURE',
        guid: '4b6463d1-30e1-425e-b7d2-77205bc75de6',
        title: 'Profit',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'MEASURE',
        guid: '809d03e1-15b7-4bdc-b108-653603a27001',
        title: 'Sales',
        datasetId: '4fnqsvsxtmcix',
    },
    {
        type: 'MEASURE',
        guid: '21eaad10-0cc2-11ed-9fc7-c54699cfb56e',
        title: 'Height (1)',
        datasetId: 'wz12arsqpvuup',
    },
];
exports.COLUMNS = [
    'ac8dd226-3372-4212-bde7-17afc792a728',
    '4b6463d1-30e1-425e-b7d2-77205bc75de6',
];
exports.COLUMNS_FOR_ORDER_TEST = [
    '4b6463d1-30e1-425e-b7d2-77205bc75de6',
    'ac8dd226-3372-4212-bde7-17afc792a728',
    '809d03e1-15b7-4bdc-b108-653603a27001',
];
exports.COLUMNS_FOR_DATASET_ID_1 = [
    'ac8dd226-3372-4212-bde7-17afc792a728',
    '4b6463d1-30e1-425e-b7d2-77205bc75de6',
    '809d03e1-15b7-4bdc-b108-653603a27001',
];
exports.COLUMNS_FOR_DATASET_ID_2 = [
    '21eaad10-0cc2-11ed-9fc7-c54699cfb56e',
    'c5eb54f9-1fe6-436d-8d47-7529de3857af',
];
exports.DATASET_ID_1 = '4fnqsvsxtmcix';
exports.DATASET_ID_2 = 'wz12arsqpvuup';
