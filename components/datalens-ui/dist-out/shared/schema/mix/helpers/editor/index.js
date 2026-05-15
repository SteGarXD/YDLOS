"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEntryLinks = getEntryLinks;
const get_1 = __importDefault(require("lodash/get"));
const isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
const modules_1 = require("../../../../modules");
__exportStar(require("./validation"), exports);
function getEntryLinks(args) {
    const { data } = args;
    const links = {};
    if (typeof (data === null || data === void 0 ? void 0 : data.meta) === 'string') {
        try {
            const meta = JSON.parse(data.meta);
            const metaLinks = (0, get_1.default)(meta, 'links');
            if ((0, isPlainObject_1.default)(metaLinks)) {
                Object.values(metaLinks).forEach((value) => {
                    links[value] = value;
                });
            }
            return links;
        }
        catch (e) { }
    }
    if (typeof (data === null || data === void 0 ? void 0 : data.shared) === 'string') {
        try {
            const shared = JSON.parse(data.shared);
            const datasetIds = (0, get_1.default)(shared, 'datasetsIds');
            if (datasetIds) {
                Object.assign(links, (0, modules_1.getDatasetLinks)(shared));
            }
            const connectionEntryId = (0, get_1.default)(shared, 'connection.entryId');
            if (connectionEntryId) {
                links.connection = connectionEntryId;
            }
        }
        catch (e) { }
    }
    return links;
}
