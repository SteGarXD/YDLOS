"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLineTimeDistinctValue = void 0;
exports.getDistinctValue = getDistinctValue;
const getLineTimeDistinctValue = (distinct, prevDistinct) => {
    if (distinct === 'null') {
        return prevDistinct;
    }
    return prevDistinct.length > 0 ? `${prevDistinct}; ${distinct}` : `${distinct}`;
};
exports.getLineTimeDistinctValue = getLineTimeDistinctValue;
function getDistinctValue(value) {
    return value === null ? 'Null' : String(value);
}
