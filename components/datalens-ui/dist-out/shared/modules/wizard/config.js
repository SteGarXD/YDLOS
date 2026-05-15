"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatasetLinks = getDatasetLinks;
function getDatasetLinks(config) {
    const links = {};
    config.datasetsIds.forEach((id, i) => {
        const key = `dataset${i > 0 ? i : ''}`;
        links[key] = id;
    });
    return links;
}
