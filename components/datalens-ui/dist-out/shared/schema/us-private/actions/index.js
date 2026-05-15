"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const entries_1 = require("./entries");
const tenant_1 = require("./tenant");
exports.actions = {
    ...entries_1.entriesActions,
    ...tenant_1.tenantActions,
};
