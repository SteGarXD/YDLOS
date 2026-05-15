"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.piePrepareForQLResult = exports.piePrepareForQLArgs = exports.piePrepareArgs = exports.measureTextAndMeasure = exports.measureNumberAndMeasure = exports.piePrepareBaseArgs = exports.measureField = exports.colorFieldMeasureString = exports.colorFieldMeasureNumber = exports.colorFieldDimensionFloat = exports.colorFieldDimension = void 0;
exports.getPrepareFunctionArgs = getPrepareFunctionArgs;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep"));
const merge_1 = __importDefault(require("lodash/merge"));
const shared_1 = require("../../../../../../../../../shared");
const classic_20_1 = __importDefault(require("../../../../../../../../../shared/constants/colors/common/classic-20"));
const common_mock_1 = require("../../../__tests__/common.mock");
const chartEditorMock = {
    getLang: () => {
        return 'en';
    },
    updateHighchartsConfig: () => { },
    updateConfig: () => { },
    getWidgetConfig: () => { },
};
const datasetId = 'j43msj9o23ge9';
exports.colorFieldDimension = {
    type: 'DIMENSION',
    datasetId: datasetId,
    title: 'ColorField',
    guid: 'colorFieldDimension_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
};
exports.colorFieldDimensionFloat = {
    type: 'DIMENSION',
    datasetId: datasetId,
    title: 'ColorField',
    guid: 'colorFieldDimensionFloat_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.FLOAT,
};
exports.colorFieldMeasureNumber = {
    type: 'MEASURE',
    datasetId: datasetId,
    title: 'ColorField',
    guid: 'colorFieldMeasureNumber_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.INTEGER,
};
exports.colorFieldMeasureString = {
    type: 'MEASURE',
    datasetId: datasetId,
    title: 'ColorField',
    guid: 'colorFieldMeasureString_guid',
    data_type: shared_1.DATASET_FIELD_TYPES.STRING,
};
exports.measureField = {
    type: 'MEASURE',
    datasetId: datasetId,
    title: 'MeasureField',
    guid: 'a6b94410-e219-11e9-a279-0b30c0a74ab7',
    data_type: shared_1.DATASET_FIELD_TYPES.INTEGER,
};
exports.piePrepareBaseArgs = {
    placeholders: [
        {
            id: 'colors',
            items: [exports.colorFieldDimension],
        },
        {
            id: 'measures',
            items: [exports.measureField],
        },
    ],
    colors: [exports.colorFieldDimension],
    resultData: {
        data: [
            ['1', '1'],
            ['2', '2'],
        ],
        order: [exports.colorFieldDimension, exports.measureField],
        totals: [],
    },
    colorsConfig: {
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
        gradientColors: ['#0044A3', '#8CCBFF'],
        loadedColorPalettes: {},
    },
    features: {},
    defaultColorPaletteId: shared_1.COMMON_PALETTE_ID.CLASSIC_20,
};
exports.measureNumberAndMeasure = {
    placeholders: [
        {
            id: 'colors',
            items: [exports.colorFieldMeasureNumber],
        },
        {
            id: 'measures',
            items: [exports.measureField],
        },
    ],
    resultData: {
        data: [
            ['1', '1'],
            ['2', '2'],
        ],
        order: [exports.colorFieldMeasureNumber, exports.measureField],
        totals: [],
    },
    colorsConfig: {
        gradientMode: '2-point',
        gradientPalette: 'violet',
        polygonBorders: 'show',
        reversed: false,
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
        gradientColors: ['#6B32C9', '#D0A3FF'],
        loadedColorPalettes: {},
    },
    defaultColorPaletteId: shared_1.COMMON_PALETTE_ID.CLASSIC_20,
};
exports.measureTextAndMeasure = {
    placeholders: [
        {
            id: 'colors',
            items: [exports.colorFieldMeasureString],
        },
        {
            id: 'measures',
            items: [exports.measureField],
        },
    ],
    colors: [exports.colorFieldMeasureString],
    resultData: {
        data: [
            ['1', '1'],
            ['2', '2'],
        ],
        order: [exports.colorFieldMeasureString, exports.measureField],
        totals: [],
    },
    colorsConfig: {
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
        gradientColors: ['#0044A3', '#8CCBFF'],
        loadedColorPalettes: {},
    },
    defaultColorPaletteId: shared_1.COMMON_PALETTE_ID.CLASSIC_20,
};
exports.piePrepareArgs = {
    ChartEditor: {
        getWidgetConfig: () => { },
    },
    datasets: [],
    fields: [],
    shapes: [],
    visualizationId: 'pie',
    shared: {
        type: 'datalens',
    },
    idToDataType: {
        [exports.colorFieldDimension.guid]: exports.colorFieldDimension.data_type,
        [exports.colorFieldDimensionFloat.guid]: exports.colorFieldDimensionFloat.data_type,
        [exports.colorFieldMeasureNumber.guid]: exports.colorFieldMeasureNumber.data_type,
        [exports.colorFieldMeasureString.guid]: exports.colorFieldMeasureString.data_type,
        [exports.measureField.guid]: exports.measureField.data_type,
    },
    idToTitle: {
        [exports.colorFieldDimension.guid]: exports.colorFieldDimension.title,
        [exports.colorFieldDimensionFloat.guid]: exports.colorFieldDimensionFloat.title,
        [exports.colorFieldMeasureNumber.guid]: exports.colorFieldMeasureNumber.title,
        [exports.colorFieldMeasureString.guid]: exports.colorFieldMeasureString.title,
        [exports.measureField.guid]: exports.measureField.title,
    },
    ...exports.piePrepareBaseArgs,
};
exports.piePrepareForQLArgs = {
    ...common_mock_1.EmptyPrepapreArgs,
    placeholders: [
        {
            allowedTypes: {},
            allowedDataTypes: {},
            id: 'colors',
            type: 'colors',
            title: 'section_color',
            iconProps: {},
            items: [
                {
                    guid: 'wall_material-1',
                    title: 'wall_material',
                    datasetId: 'ql-mocked-dataset',
                    data_type: 'string',
                    cast: 'string',
                    type: 'DIMENSION',
                    calc_mode: 'direct',
                    inspectHidden: true,
                    formulaHidden: true,
                    noEdit: true,
                },
            ],
            required: true,
            capacity: 1,
        },
        {
            allowedTypes: {},
            allowedFinalTypes: {},
            allowedDataTypes: {},
            id: 'measures',
            type: 'measures',
            title: 'section_measures',
            iconProps: {},
            items: [
                {
                    guid: 'iznos-0',
                    title: 'iznos',
                    datasetId: 'ql-mocked-dataset',
                    data_type: 'float',
                    cast: 'float',
                    type: 'DIMENSION',
                    calc_mode: 'direct',
                    inspectHidden: true,
                    formulaHidden: true,
                    noEdit: true,
                },
            ],
            required: true,
            capacity: 1,
        },
    ],
    fields: [],
    colors: [],
    colorsConfig: {
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
        gradientColors: ['#0044A3', '#8CCBFF'],
        loadedColorPalettes: {},
    },
    sort: [],
    visualizationId: 'pie',
    labels: [],
    tooltips: [],
    datasets: [],
    resultData: {
        data: [
            ['Не заполнено', 67],
            ['Не заполнено', 100],
            ['Смешанные', 70],
            ['Деревянные', 40],
            ['Не заполнено', null],
            ['Не заполнено', null],
            ['Не заполнено', null],
            ['Кирпич', 78],
            ['Деревянные', 67],
            ['Не заполнено', 72],
        ],
        order: [
            { datasetId: 'ql-mocked-dataset', title: 'wall_material' },
            { datasetId: 'ql-mocked-dataset', title: 'iznos' },
            { datasetId: 'ql-mocked-dataset', title: 'Column Names' },
        ],
        totals: [],
    },
    idToTitle: { 'wall_material-1': 'wall_material', 'iznos-0': 'iznos', '': 'Column Names' },
    idToDataType: { 'wall_material-1': 'string', 'iznos-0': 'float', '': 'string' },
    shared: {
        sharedData: {},
    },
    ChartEditor: chartEditorMock,
    shapes: [],
    shapesConfig: {},
    segments: [],
    disableDefaultSorting: false,
    defaultColorPaletteId: shared_1.COMMON_PALETTE_ID.CLASSIC_20,
};
exports.piePrepareForQLResult = {
    graphs: [
        {
            name: 'iznos',
            pointConflict: true,
            tooltip: { chartKitFormatting: true, chartKitPrecision: 2 },
            dataLabels: { chartKitFormatting: true, chartKitPrecision: 0, useHTML: false },
            data: [
                {
                    name: 'Кирпич',
                    formattedName: 'Кирпич',
                    drillDownFilterValue: 'Кирпич',
                    y: 78,
                    colorGuid: 'wall_material-1',
                    colorValue: 'Кирпич',
                    color: '#4DA2F1',
                },
                {
                    name: 'Не заполнено',
                    formattedName: 'Не заполнено',
                    drillDownFilterValue: 'Не заполнено',
                    y: 72,
                    colorGuid: 'wall_material-1',
                    colorValue: 'Не заполнено',
                    color: '#FF3D64',
                },
                {
                    name: 'Смешанные',
                    formattedName: 'Смешанные',
                    drillDownFilterValue: 'Смешанные',
                    y: 70,
                    colorGuid: 'wall_material-1',
                    colorValue: 'Смешанные',
                    color: '#8AD554',
                },
                {
                    name: 'Деревянные',
                    formattedName: 'Деревянные',
                    drillDownFilterValue: 'Деревянные',
                    y: 67,
                    colorGuid: 'wall_material-1',
                    colorValue: 'Деревянные',
                    color: '#FFC636',
                },
            ],
        },
    ],
};
function getPrepareFunctionArgs(options = {}) {
    return (0, merge_1.default)((0, cloneDeep_1.default)(exports.piePrepareArgs), options);
}
