"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSource = void 0;
const opensource_1 = require("./opensource");
const resolveSource = (_appInstallation, appEnvironment) => {
    return opensource_1.opensourceSources[appEnvironment];
};
exports.resolveSource = resolveSource;
