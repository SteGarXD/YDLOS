"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectPlaceholders = void 0;
const selectPlaceholders = (placeholders, ids) => {
    const uniqueIds = new Set(ids);
    return (placeholders !== null && placeholders !== void 0 ? placeholders : []).reduce((selectedPlaceholders, p) => {
        const id = p.id;
        return uniqueIds.has(id)
            ? Object.defineProperty(selectedPlaceholders, id, { value: p })
            : selectedPlaceholders;
    }, {});
};
exports.selectPlaceholders = selectPlaceholders;
