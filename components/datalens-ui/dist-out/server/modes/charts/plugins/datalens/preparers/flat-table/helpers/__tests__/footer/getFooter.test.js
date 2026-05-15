"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../../../../../../../shared");
const footer_1 = require("../../footer");
const footerHelpersModule = __importStar(require("../../footer"));
const getFooter_mock_1 = require("../mocks/getFooter.mock");
const i18nMock = {
    I18n: {
        keyset: (_str) => {
            return function (key, params) {
                if (key === 'label_total-value') {
                    return `Total: ${params.value}`;
                }
                return `Total`;
            };
        },
    },
    I18N: {
        getLang: () => {
            return 'en';
        },
        setLang: jest.fn(),
    },
};
jest.mock('../../../../../../../../../../i18n', () => i18nMock);
describe('getFooter', () => {
    const ChartEditorMock = {
        getLang: () => 'en',
        getTranslation: (keyset, key, params) => {
            return i18nMock.I18n.keyset(keyset)(key, params);
        },
    };
    const colorsConfig = {
        loadedColorPalettes: {},
        colors: [],
        gradientColors: [],
        availablePalettes: {},
    };
    it('Returns the footer: in the first place is always "Total"', () => {
        const footer = (0, footer_1.getFooter)({
            columns: getFooter_mock_1.COLUMNS,
            idToDataType: getFooter_mock_1.ID_TO_DATA_TYPE,
            idToTitle: getFooter_mock_1.ID_TO_TITLE,
            totals: getFooter_mock_1.TOTALS,
            order: getFooter_mock_1.ORDER,
            columnValuesByColumn: {},
            ChartEditor: ChartEditorMock,
            colorsConfig,
            defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
        });
        expect(footer[0].cells).toHaveLength(2);
        expect(footer[0].cells[0].value).toEqual('Total');
        expect(footer[0].cells[1].value).toEqual(282070);
    });
    it('All footer cells have the same style', () => {
        const expectedStyles = {
            'background-color': 'var(--g-color-base-generic)',
            'font-weight': 500,
        };
        const footer = (0, footer_1.getFooter)({
            columns: getFooter_mock_1.COLUMNS,
            idToDataType: getFooter_mock_1.ID_TO_DATA_TYPE,
            idToTitle: getFooter_mock_1.ID_TO_TITLE,
            totals: getFooter_mock_1.TOTALS,
            order: getFooter_mock_1.ORDER,
            columnValuesByColumn: {},
            ChartEditor: ChartEditorMock,
            colorsConfig,
            defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
        });
        footer[0].cells.forEach((cell) => {
            expect(cell.css).toEqual(expectedStyles);
        });
    });
    it('If there is an measure in the first column, then the function returns "Total" with the measure value', () => {
        const footer = (0, footer_1.getFooter)({
            columns: [...getFooter_mock_1.COLUMNS].reverse(),
            idToDataType: getFooter_mock_1.ID_TO_DATA_TYPE,
            idToTitle: getFooter_mock_1.ID_TO_TITLE,
            totals: [...getFooter_mock_1.TOTALS].reverse(),
            order: [...getFooter_mock_1.ORDER].reverse(),
            columnValuesByColumn: {},
            ChartEditor: ChartEditorMock,
            colorsConfig,
            defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
        });
        expect(footer[0].cells).toHaveLength(2);
        expect(footer[0].cells[0].value).toEqual('Total: 282070');
        expect(footer[0].cells[1].value).toEqual('');
    });
    it('The total is set correctly, even if the field is duplicated in columns', () => {
        const footer = (0, footer_1.getFooter)({
            columns: getFooter_mock_1.COLUMNS_WITH_DUPLICATES,
            idToTitle: getFooter_mock_1.ID_TO_TITLE,
            idToDataType: getFooter_mock_1.ID_TO_DATA_TYPE,
            totals: getFooter_mock_1.TOTALS,
            order: getFooter_mock_1.ORDER,
            columnValuesByColumn: {},
            ChartEditor: ChartEditorMock,
            colorsConfig,
            defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
        });
        expect(footer[0].cells).toHaveLength(4);
        expect(footer[0].cells[0].value).toEqual('Total');
        expect(footer[0].cells[1].value).toEqual(282070);
        expect(footer[0].cells[2].value).toEqual(282070);
        expect(footer[0].cells[3].value).toEqual('');
    });
    it('The title setting function is called 1 time during the entire getFooter operation', () => {
        const getTotalTitleFake = jest.spyOn(footerHelpersModule, 'getTotalTitle');
        const footer = (0, footer_1.getFooter)({
            columns: getFooter_mock_1.COLUMNS_WITH_DUPLICATES,
            idToDataType: getFooter_mock_1.ID_TO_DATA_TYPE,
            idToTitle: getFooter_mock_1.ID_TO_TITLE,
            totals: getFooter_mock_1.TOTALS,
            order: getFooter_mock_1.ORDER,
            columnValuesByColumn: {},
            ChartEditor: ChartEditorMock,
            colorsConfig,
            defaultColorPaletteId: shared_1.PALETTE_ID.CLASSIC_20,
        });
        expect(footer[0].cells).toHaveLength(4);
        expect(getTotalTitleFake).toBeCalledTimes(1);
    });
});
