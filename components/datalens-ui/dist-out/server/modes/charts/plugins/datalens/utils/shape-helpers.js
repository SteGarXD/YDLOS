"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapAndShapeGraph = void 0;
const shared_1 = require("../../../../../../shared");
const SHAPES_IN_ORDER = (0, shared_1.getServerShapesOrder)();
const mapAndShapeGraph = ({ graphs, isSegmentsExists, shapesConfig, isShapesDefault, }) => {
    const knownValues = [];
    graphs.forEach((graph, i) => {
        const value = graph.shapeValue;
        const title = value || graph.legendTitle || graph.name;
        if (shapesConfig &&
            shapesConfig.mountedShapes &&
            title &&
            shapesConfig.mountedShapes[title] &&
            shapesConfig.mountedShapes[title] !== 'auto') {
            graph.dashStyle = shapesConfig.mountedShapes[title];
        }
        else if (isShapesDefault) {
            graph.dashStyle = SHAPES_IN_ORDER[0];
        }
        else {
            let shapeIndex = graph.yAxis === 0 || !graph.shapeValue || isSegmentsExists
                ? knownValues.indexOf(value)
                : i;
            if (shapeIndex === -1) {
                knownValues.push(value);
                shapeIndex = knownValues.length - 1;
            }
            graph.dashStyle = SHAPES_IN_ORDER[shapeIndex % SHAPES_IN_ORDER.length];
        }
    });
};
exports.mapAndShapeGraph = mapAndShapeGraph;
