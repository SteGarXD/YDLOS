"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPointsByShape = mapPointsByShape;
const lodash_1 = require("lodash");
const shared_1 = require("../../../../../../../../shared");
function getShapeByFieldValueSelector(shapeConfig) {
    const shapeSymbolsByValue = new Map();
    return (shapeValue) => {
        var _a;
        const mountedShape = (_a = shapeConfig === null || shapeConfig === void 0 ? void 0 : shapeConfig.mountedShapes) === null || _a === void 0 ? void 0 : _a[shapeValue];
        if (mountedShape && mountedShape !== 'auto') {
            return mountedShape;
        }
        if (!shapeSymbolsByValue.has(shapeValue)) {
            const shapeSymbol = shared_1.POINT_SHAPES_IN_ORDER[shapeSymbolsByValue.size % shared_1.POINT_SHAPES_IN_ORDER.length];
            shapeSymbolsByValue.set(shapeValue, shapeSymbol);
        }
        return shapeSymbolsByValue.get(shapeValue);
    };
}
function mapPointsByShape({ graphs, shapesConfig, field, }) {
    const result = [];
    const getShapeByFieldValue = getShapeByFieldValueSelector(shapesConfig);
    const isMarkupShape = (0, shared_1.isMarkupField)(field);
    graphs.forEach((graph) => {
        const graphData = graph.data || [];
        const groups = (0, lodash_1.groupBy)(graphData, (point) => {
            const value = point.shapeValue || '';
            if (isMarkupShape) {
                return (0, shared_1.markupToRawString)(value);
            }
            return value;
        });
        Object.keys(groups)
            .sort()
            .forEach((shapeValue) => {
            const points = groups[shapeValue];
            const colorValue = points[0].colorValue;
            let name = shapeValue;
            if (colorValue && colorValue !== shapeValue) {
                name = `${colorValue}: ${shapeValue}`;
            }
            result.push({
                ...graph,
                name,
                data: points,
                marker: {
                    symbol: getShapeByFieldValue(shapeValue),
                },
            });
        });
    });
    return result;
}
