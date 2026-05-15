"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamAccessDialogActions = void 0;
const gateway_utils_1 = require("../../gateway-utils");
exports.iamAccessDialogActions = {
    listCollectionAccessBindings: (0, gateway_utils_1.createAction)(async () => []),
    updateCollectionAccessBindings: (0, gateway_utils_1.createAction)(async () => {
        return {};
    }),
    listWorkbookAccessBindings: (0, gateway_utils_1.createAction)(async () => []),
    updateWorkbookAccessBindings: (0, gateway_utils_1.createAction)(async () => {
        return {};
    }),
    getClaims: (0, gateway_utils_1.createAction)(async () => {
        return { subjectDetails: [] };
    }),
    batchListMembers: (0, gateway_utils_1.createAction)(async () => {
        return { members: [], nextPageToken: '' };
    }),
};
