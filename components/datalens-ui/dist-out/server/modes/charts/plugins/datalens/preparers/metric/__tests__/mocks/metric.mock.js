"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricPrepareForQLResult = exports.metricPrepareForQLArgs = void 0;
const shared_1 = require("../../../../../../../../../shared");
const classic_20_1 = __importDefault(require("../../../../../../../../../shared/constants/colors/common/classic-20"));
exports.metricPrepareForQLArgs = {
    placeholders: [
        {
            allowedTypes: {},
            allowedFinalTypes: {},
            allowedDataTypes: {},
            id: 'measures',
            type: 'measures',
            title: 'section_measure',
            iconProps: {},
            items: [
                {
                    guid: 'avg-0',
                    title: 'avg',
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
        colors: [
            '#4DA2F1',
            '#FF3D64',
            '#8AD554',
            '#FFC636',
            '#FFB9DD',
            '#84D1EE',
            '#FF91A1',
            '#54A520',
            '#DB9100',
            '#BA74B3',
            '#1F68A9',
            '#ED65A9',
            '#0FA08D',
            '#FF7E00',
            '#E8B0A4',
            '#52A6C5',
            '#BE2443',
            '#70C1AF',
            '#FFB46C',
            '#DCA3D7',
        ],
        gradientColors: ['#0044A3', '#8CCBFF'],
        loadedColorPalettes: {},
        availablePalettes: { [shared_1.COMMON_PALETTE_ID.CLASSIC_20]: classic_20_1.default },
    },
    sort: [],
    visualizationId: 'metric',
    labels: [],
    tooltips: [],
    datasets: [],
    resultData: {
        data: [[71.09428467192288]],
        order: [{ datasetId: 'ql-mocked-dataset', title: 'avg' }],
        totals: [],
    },
    idToTitle: { 'avg-0': 'avg' },
    idToDataType: { 'avg-0': 'float' },
    shared: {
        sharedData: {},
    },
    ChartEditor: {
        getWidgetConfig: () => { },
    },
    shapes: [],
    shapesConfig: {},
    segments: [],
    disableDefaultSorting: false,
    defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
};
exports.metricPrepareForQLResult = [
    {
        content: { current: { value: 71.09428467192288, precision: 2 } },
        size: '',
        color: classic_20_1.default.scheme[0],
        title: 'avg',
    },
];
