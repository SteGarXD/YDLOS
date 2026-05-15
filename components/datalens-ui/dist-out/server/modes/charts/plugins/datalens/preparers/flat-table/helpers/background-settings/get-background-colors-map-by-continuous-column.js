"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackgroundColorsMapByContinuousColumn = void 0;
exports.colorizeFlatTableColumn = colorizeFlatTableColumn;
const isNil_1 = __importDefault(require("lodash/isNil"));
const shared_1 = require("../../../../../../../../../shared");
const color_helpers_1 = require("../../../../utils/color-helpers");
const misc_helpers_1 = require("../../../../utils/misc-helpers");
const misc_1 = require("../../../helpers/backgroundSettings/misc");
function colorizeFlatTableColumn({ data, colorsConfig, index, }) {
    const nilValue = colorsConfig.nullMode === shared_1.GradientNullModes.AsZero ? 0 : null;
    const colorValues = data.reduce((acc, row) => {
        const rowValue = row[index];
        const parsedRowValue = (0, isNil_1.default)(rowValue) ? nilValue : parseFloat(rowValue);
        acc.push(parsedRowValue);
        return acc;
    }, []);
    return (0, color_helpers_1.colorizeByColorValues)({ colorValues, colorsConfig });
}
const getBackgroundColorsMapByContinuousColumn = (args) => {
    const { columns, idToTitle, order, data, chartColorsConfig } = args;
    const columnsWithBackgroundSettings = columns.filter((column) => (0, misc_helpers_1.isTableFieldBackgroundSettingsEnabled)(column));
    const measuresWhichUsedForColorizing = columnsWithBackgroundSettings.filter((column) => column.backgroundSettings.settings.isContinuous);
    return measuresWhichUsedForColorizing.reduce((acc, column) => {
        var _a;
        const backgroundColors = column.backgroundSettings;
        const guid = backgroundColors.colorFieldGuid;
        const gradientState = backgroundColors.settings.gradientState;
        const colorsConfig = {
            ...gradientState,
            colors: [],
            loadedColorPalettes: {},
            availablePalettes: chartColorsConfig.availablePalettes,
            gradientColors: ((_a = (0, misc_1.getCurrentBackgroundGradient)(gradientState, chartColorsConfig.loadedColorPalettes)) === null || _a === void 0 ? void 0 : _a.colors) || [],
        };
        const title = idToTitle[guid];
        const index = (0, misc_helpers_1.findIndexInOrder)(order, column, title);
        const rgbColorValues = colorizeFlatTableColumn({
            colorsConfig: colorsConfig,
            index,
            data,
        });
        return {
            ...acc,
            [backgroundColors.settingsId]: rgbColorValues,
        };
    }, {});
};
exports.getBackgroundColorsMapByContinuousColumn = getBackgroundColorsMapByContinuousColumn;
