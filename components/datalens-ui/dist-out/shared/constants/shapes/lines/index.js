"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerShapesOrder = exports.selectShapes = exports.SHAPES_PALETTE_ORDER = exports.SHAPES_ORDER = exports.LineShapeType = void 0;
var LineShapeType;
(function (LineShapeType) {
    LineShapeType["Solid"] = "Solid";
    LineShapeType["ShortDash"] = "ShortDash";
    LineShapeType["ShortDot"] = "ShortDot";
    LineShapeType["ShortDashDot"] = "ShortDashDot";
    LineShapeType["ShortDashDotDot"] = "ShortDashDotDot";
    LineShapeType["Dot"] = "Dot";
    LineShapeType["Dash"] = "Dash";
    LineShapeType["LongDash"] = "LongDash";
    LineShapeType["DashDot"] = "DashDot";
    LineShapeType["LongDashDot"] = "LongDashDot";
    LineShapeType["LongDashDotDot"] = "LongDashDotDot";
})(LineShapeType || (exports.LineShapeType = LineShapeType = {}));
exports.SHAPES_ORDER = {
    [LineShapeType.Solid]: 1,
    [LineShapeType.Dash]: 2,
    [LineShapeType.Dot]: 3,
    [LineShapeType.ShortDashDot]: 4,
    [LineShapeType.LongDash]: 5,
    [LineShapeType.LongDashDot]: 6,
    [LineShapeType.ShortDot]: 7,
    [LineShapeType.LongDashDotDot]: 8,
    [LineShapeType.ShortDash]: 9,
    [LineShapeType.DashDot]: 10,
    [LineShapeType.ShortDashDotDot]: 11,
};
exports.SHAPES_PALETTE_ORDER = {
    ...exports.SHAPES_ORDER,
    auto: Math.max.apply(null, Object.values(exports.SHAPES_ORDER)) + 1,
};
const selectShapes = () => Object.values(LineShapeType);
exports.selectShapes = selectShapes;
const getServerShapesOrder = () => (0, exports.selectShapes)().sort((a, b) => exports.SHAPES_ORDER[a] - exports.SHAPES_ORDER[b]);
exports.getServerShapesOrder = getServerShapesOrder;
