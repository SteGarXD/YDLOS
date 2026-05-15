"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapCenterMode = exports.ZoomMode = exports.SortDirection = exports.BarsAlignValues = exports.BarsColorType = exports.MAX_SEGMENTS_NUMBER = exports.DEFAULT_INTEGER_NUMBERS = exports.DEFAULT_FLOAT_NUMBERS = exports.DEFAULT_FORMATTING = exports.PseudoFieldTitle = exports.NavigatorLinesMode = exports.NavigatorModes = exports.VISUALIZATIONS_WITH_NAVIGATOR = void 0;
const types_1 = require("../types");
const visualization_1 = require("./visualization");
exports.VISUALIZATIONS_WITH_NAVIGATOR = new Set([
    visualization_1.WizardVisualizationId.Line,
    visualization_1.WizardVisualizationId.Area,
    visualization_1.WizardVisualizationId.Area100p,
    visualization_1.WizardVisualizationId.Column,
]);
var NavigatorModes;
(function (NavigatorModes) {
    NavigatorModes["Show"] = "show";
    NavigatorModes["Hide"] = "hide";
})(NavigatorModes || (exports.NavigatorModes = NavigatorModes = {}));
var NavigatorLinesMode;
(function (NavigatorLinesMode) {
    NavigatorLinesMode["All"] = "all";
    NavigatorLinesMode["Selected"] = "selected";
})(NavigatorLinesMode || (exports.NavigatorLinesMode = NavigatorLinesMode = {}));
var PseudoFieldTitle;
(function (PseudoFieldTitle) {
    PseudoFieldTitle["MeasureNames"] = "Measure Names";
    PseudoFieldTitle["ColumnNames"] = "Column Names";
    PseudoFieldTitle["MeasureValues"] = "Measure Values";
})(PseudoFieldTitle || (exports.PseudoFieldTitle = PseudoFieldTitle = {}));
exports.DEFAULT_FORMATTING = {
    format: types_1.NumberFormatType.Number,
    showRankDelimiter: true,
    prefix: '',
    postfix: '',
    unit: undefined,
    labelMode: 'absolute',
    precision: undefined,
};
exports.DEFAULT_FLOAT_NUMBERS = 2;
exports.DEFAULT_INTEGER_NUMBERS = 0;
exports.MAX_SEGMENTS_NUMBER = 25;
var BarsColorType;
(function (BarsColorType) {
    BarsColorType["Gradient"] = "gradient";
    BarsColorType["OneColor"] = "one-color";
    BarsColorType["TwoColor"] = "two-color";
})(BarsColorType || (exports.BarsColorType = BarsColorType = {}));
var BarsAlignValues;
(function (BarsAlignValues) {
    BarsAlignValues["Left"] = "left";
    BarsAlignValues["Right"] = "right";
    BarsAlignValues["Default"] = "default";
})(BarsAlignValues || (exports.BarsAlignValues = BarsAlignValues = {}));
var SortDirection;
(function (SortDirection) {
    SortDirection["ASC"] = "ASC";
    SortDirection["DESC"] = "DESC";
})(SortDirection || (exports.SortDirection = SortDirection = {}));
exports.ZoomMode = {
    Auto: 'auto',
    Manual: 'manual',
};
exports.MapCenterMode = {
    Auto: 'auto',
    Manual: 'manual',
};
