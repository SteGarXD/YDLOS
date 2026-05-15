"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRequestForDeveloperModeAccess = void 0;
const types_1 = require("../../shared/types");
const checkRequestForDeveloperModeAccess = async () => {
    return types_1.DeveloperModeCheckStatus.Allowed;
};
exports.checkRequestForDeveloperModeAccess = checkRequestForDeveloperModeAccess;
