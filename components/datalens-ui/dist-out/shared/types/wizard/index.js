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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMetricShared = exports.isTableShared = exports.isGraphScatterShared = exports.LabelsPositions = void 0;
exports.isGraphShared = isGraphShared;
__exportStar(require("./field"), exports);
__exportStar(require("./versions"), exports);
__exportStar(require("./bars"), exports);
__exportStar(require("./column"), exports);
__exportStar(require("./background-settings"), exports);
__exportStar(require("./misc"), exports);
__exportStar(require("./placeholder"), exports);
__exportStar(require("./sub-totals"), exports);
__exportStar(require("./export"), exports);
var LabelsPositions;
(function (LabelsPositions) {
    LabelsPositions["Outside"] = "outside";
    LabelsPositions["Inside"] = "inside";
})(LabelsPositions || (exports.LabelsPositions = LabelsPositions = {}));
function isGraphShared(shared) {
    return (shared.visualization.id === 'line' ||
        shared.visualization.id === 'area' ||
        shared.visualization.id === 'area100p' ||
        shared.visualization.id === 'column' ||
        shared.visualization.id === 'column100p' ||
        shared.visualization.id === 'bar' ||
        shared.visualization.id === 'bar100p' ||
        shared.visualization.id === 'pie' ||
        shared.visualization.id === 'donut' ||
        shared.visualization.id === 'scatter' ||
        shared.visualization.id === 'treemap');
}
const isGraphScatterShared = (shared) => shared.visualization.id === 'scatter';
exports.isGraphScatterShared = isGraphScatterShared;
const isTableShared = (shared) => shared.visualization.id === 'flatTable' || shared.visualization.id === 'pivotTable';
exports.isTableShared = isTableShared;
const isMetricShared = (shared) => shared.visualization.id === 'metric';
exports.isMetricShared = isMetricShared;
