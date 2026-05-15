"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("../../../../shared");
const utils_1 = require("../utils");
exports.default = (0, utils_1.createFeatureConfig)({
    name: shared_1.Feature.ReadOnlyMode,
    state: {
        development: false,
        production: (0, shared_1.isTrueArg)(process.env.READ_ONLY_MODE),
    },
});
