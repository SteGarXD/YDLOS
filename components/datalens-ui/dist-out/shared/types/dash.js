"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TitlePlacements = exports.TitlePlacementOption = exports.DashLoadPriority = exports.DashTabConnectionKind = exports.DashTabItemControlElementType = exports.DashTabItemControlSourceType = exports.DashTabItemTitleSizes = exports.DashTabItemType = exports.ControlType = void 0;
exports.isBackgroundSettings = isBackgroundSettings;
var ControlType;
(function (ControlType) {
    ControlType["Dash"] = "control_dash";
})(ControlType || (exports.ControlType = ControlType = {}));
var DashTabItemType;
(function (DashTabItemType) {
    DashTabItemType["Title"] = "title";
    DashTabItemType["Text"] = "text";
    DashTabItemType["Widget"] = "widget";
    DashTabItemType["Control"] = "control";
    DashTabItemType["GroupControl"] = "group_control";
    DashTabItemType["Image"] = "image";
})(DashTabItemType || (exports.DashTabItemType = DashTabItemType = {}));
exports.DashTabItemTitleSizes = {
    XL: 'xl',
    L: 'l',
    M: 'm',
    S: 's',
    XS: 'xs',
};
var DashTabItemControlSourceType;
(function (DashTabItemControlSourceType) {
    DashTabItemControlSourceType["Dataset"] = "dataset";
    DashTabItemControlSourceType["Connection"] = "connection";
    DashTabItemControlSourceType["Manual"] = "manual";
    DashTabItemControlSourceType["External"] = "external";
})(DashTabItemControlSourceType || (exports.DashTabItemControlSourceType = DashTabItemControlSourceType = {}));
var DashTabItemControlElementType;
(function (DashTabItemControlElementType) {
    DashTabItemControlElementType["Select"] = "select";
    DashTabItemControlElementType["Date"] = "date";
    DashTabItemControlElementType["Input"] = "input";
    DashTabItemControlElementType["Checkbox"] = "checkbox";
})(DashTabItemControlElementType || (exports.DashTabItemControlElementType = DashTabItemControlElementType = {}));
var DashTabConnectionKind;
(function (DashTabConnectionKind) {
    DashTabConnectionKind["Ignore"] = "ignore";
})(DashTabConnectionKind || (exports.DashTabConnectionKind = DashTabConnectionKind = {}));
var DashLoadPriority;
(function (DashLoadPriority) {
    DashLoadPriority["Charts"] = "charts";
    DashLoadPriority["Selectors"] = "selectors";
})(DashLoadPriority || (exports.DashLoadPriority = DashLoadPriority = {}));
function isBackgroundSettings(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'color' in value &&
        typeof value.color === 'string' &&
        ('enabled' in value
            ? typeof value.enabled === 'boolean' || value.enabled === undefined
            : true));
}
var TitlePlacementOption;
(function (TitlePlacementOption) {
    TitlePlacementOption["Left"] = "left";
    TitlePlacementOption["Top"] = "top";
})(TitlePlacementOption || (exports.TitlePlacementOption = TitlePlacementOption = {}));
exports.TitlePlacements = {
    Hide: 'hide',
    Left: TitlePlacementOption.Left,
    Top: TitlePlacementOption.Top,
};
