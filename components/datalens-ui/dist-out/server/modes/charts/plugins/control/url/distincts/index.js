"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDistinctsRequest = void 0;
const middleware_urls_1 = require("../../../constants/middleware-urls");
const prepareDistinctsRequest = (sourceArgs) => {
    const datasetId = sourceArgs.shared.source.datasetId;
    return {
        sourceArgs,
        method: 'POST',
        path: 'values/distinct',
        datasetId,
        middlewareUrl: {
            sourceName: middleware_urls_1.REQUEST_WITH_DATASET_SOURCE_NAME,
            middlewareType: middleware_urls_1.CONTROL_MIDDLEWARE_URL_TYPE,
        },
    };
};
exports.prepareDistinctsRequest = prepareDistinctsRequest;
