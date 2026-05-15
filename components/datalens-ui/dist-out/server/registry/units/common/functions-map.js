"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonFunctionsMap = void 0;
const makeFunctionTemplate_1 = require("../../../../shared/utils/makeFunctionTemplate");
exports.commonFunctionsMap = {
    getAvailablePalettesMap: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    getSourceAuthorizationHeaders: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    isEntryId: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    extractEntryId: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
    handleEntryRedirect: (0, makeFunctionTemplate_1.makeFunctionTemplate)(),
};
