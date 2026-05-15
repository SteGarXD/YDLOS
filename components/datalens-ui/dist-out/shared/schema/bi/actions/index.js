"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const connections_1 = require("./connections");
const datasets_1 = require("./datasets");
const oauth_1 = require("./oauth");
exports.actions = {
    ...connections_1.actions,
    ...datasets_1.actions,
    ...oauth_1.actions,
};
