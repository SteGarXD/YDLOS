"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBarXArgs = exports.shapeField = exports.colorField = exports.yField = exports.x2Field = exports.x1Field = void 0;
exports.getPrepareFunctionArgs = getPrepareFunctionArgs;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../../../shared");
const ChartEditor = {
    getWidgetConfig: () => { },
};
const datasetId = 'someDatasetId';
exports.x1Field = {
    datasetId,
    title: 'X1Field',
    guid: 'guidX1',
    data_type: shared_1.DATASET_FIELD_TYPES.DATE,
};
exports.x2Field = {
    datasetId,
    title: 'X2Field',
    guid: 'guidX2',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
};
exports.yField = {
    datasetId,
    title: 'YField',
    guid: 'a6b94410-e219-11e9-a279-0b30c0a74ab7',
    data_type: shared_1.DATASET_FIELD_TYPES.FLOAT,
};
exports.colorField = {
    datasetId,
    title: 'ColorField',
    guid: '38e0b1f4-d46b-48a0-8905-6a6d1e61900d',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
};
exports.shapeField = {
    datasetId,
    title: 'ShapeField',
    guid: '45bdfbb6-1dd9-41bd-9871-b011efd8ec6b',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
};
exports.prepareBarXArgs = {
    ChartEditor,
    colors: [],
    colorsConfig: { loadedColorPalettes: {}, colors: ['blue', 'red', 'orange'], gradientColors: [] },
    datasets: [],
    fields: [],
    shapes: [],
    sort: [],
    segments: [],
    visualizationId: 'column',
    shared: {
        visualization: { id: 'column' },
    },
    idToDataType: {
        [exports.x1Field.guid]: exports.x1Field.data_type,
        [exports.x2Field.guid]: exports.x2Field.data_type,
        [exports.yField.guid]: exports.yField.data_type,
        [exports.colorField.guid]: exports.colorField.data_type,
        [exports.shapeField.guid]: exports.shapeField.data_type,
    },
    idToTitle: {
        [exports.x1Field.guid]: exports.x1Field.title,
        [exports.x2Field.guid]: exports.x2Field.title,
        [exports.yField.guid]: exports.yField.title,
        [exports.colorField.guid]: exports.colorField.title,
        [exports.shapeField.guid]: exports.shapeField.title,
    },
    placeholders: [
        {
            id: 'x',
            items: [exports.x1Field],
        },
        {
            id: 'y',
            items: [exports.yField],
        },
    ],
    resultData: {
        data: [],
        order: [exports.x1Field, exports.yField],
        totals: [],
    },
    features: {},
};
function getPrepareFunctionArgs(options = {}) {
    return (0, merge_1.default)((0, cloneDeep_1.default)(exports.prepareBarXArgs), options);
}
