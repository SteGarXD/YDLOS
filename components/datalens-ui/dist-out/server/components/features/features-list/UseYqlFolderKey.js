"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../shared");
const utils_1 = require("../utils");
exports.default = (0, utils_1.createFeatureConfig)({
    name: shared_1.Feature.UseYqlFolderKey,
    state: {
        development: false,
        production: false,
    },
});
