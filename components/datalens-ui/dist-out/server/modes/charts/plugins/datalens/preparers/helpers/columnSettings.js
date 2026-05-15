"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getColumnWidthValue = void 0;
const getColumnWidthValue = (width) => {
    switch (width === null || width === void 0 ? void 0 : width.mode) {
        case 'auto':
            return undefined;
        case 'percent':
            return `${width.value}%`;
        case 'pixel':
            return `${width.value}px`;
        default:
            return undefined;
    }
};
exports.getColumnWidthValue = getColumnWidthValue;
