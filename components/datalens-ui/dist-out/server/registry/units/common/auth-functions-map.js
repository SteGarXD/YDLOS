"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authFunctionsMap = void 0;
const makeFunctionTemplate_1 = require("../../../../shared/utils/makeFunctionTemplate");
exports.authFunctionsMap = {
    getAuthArgsUSPrivate: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    getAuthHeadersUSPrivate: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    getAuthArgsProxyUSPrivate: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    getAuthHeadersBIPrivate: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    hasValidWorkbookTransferAuthHeaders: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    getAuthArgsProxyBIPrivate: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
};
