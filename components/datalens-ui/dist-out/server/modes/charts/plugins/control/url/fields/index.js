"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareFieldsRequest = void 0;
const prepareFieldsRequest = ({ datasetId, }) => {
    return {
        datasetId: datasetId,
        path: 'fields',
    };
};
exports.prepareFieldsRequest = prepareFieldsRequest;
