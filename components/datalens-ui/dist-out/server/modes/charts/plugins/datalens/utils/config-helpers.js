"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapChartsConfigToServerConfig = void 0;
exports.getConfigWithActualFieldTypes = getConfigWithActualFieldTypes;
const cloneDeepWith_1 = __importDefault(require("lodash/cloneDeepWith"));
const shared_1 = require("../../../../../../shared");
const mapChartsConfigToServerConfig = (config) => {
    const latestConfig = (0, shared_1.mapChartsConfigToLatestVersion)(config, {
        sharedData: config.sharedData || {},
    });
    const serverConfig = {
        ...latestConfig,
        sharedData: config.sharedData || {},
        // Fallback for old charts (where there are no links)
        links: latestConfig.links || [],
    };
    return serverConfig;
};
exports.mapChartsConfigToServerConfig = mapChartsConfigToServerConfig;
function isField(value) {
    return Boolean(value && typeof value === 'object' && 'guid' in value);
}
function getConfigWithActualFieldTypes(args) {
    const { config, idToDataType } = args;
    return (0, cloneDeepWith_1.default)(config, function (value) {
        var _a;
        if (isField(value)) {
            const dataType = (_a = idToDataType[value.guid]) !== null && _a !== void 0 ? _a : value.data_type;
            const field = { ...value, data_type: dataType };
            return field;
        }
        return undefined;
    });
}
