"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateTimeField = exports.IntegerField = exports.EmptyPrepapreArgs = void 0;
const shared_1 = require("../../../../../../../shared");
const classic_20_1 = __importDefault(require("../../../../../../../shared/constants/colors/common/classic-20"));
exports.EmptyPrepapreArgs = {
    ChartEditor: {
        getWidgetConfig: () => { },
    },
    // @ts-ignore
    shared: {},
    sort: [],
    colors: [],
    colorsConfig: {
        loadedColorPalettes: {},
        colors: ['blue', 'red', 'orange'],
        gradientColors: [],
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
    },
    shapes: [],
    segments: [],
    idToTitle: {},
    idToDataType: {},
    features: {},
};
const datasetId = 'datasetId';
exports.IntegerField = {
    datasetId,
    title: 'IntegerField_title',
    guid: 'IntegerField_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.INTEGER,
};
exports.DateTimeField = {
    datasetId,
    title: 'DateTimeField_title',
    guid: 'DateTimeField_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.GENERICDATETIME,
};
