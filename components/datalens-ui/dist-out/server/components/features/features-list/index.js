"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const normalizedPath = path_1.default.join(__dirname);
const FEATURES_LIST = [];
const isBuildMetaFile = (file) => {
    return file.endsWith('d.ts') || file.endsWith('js.map');
};
fs_1.default.readdirSync(normalizedPath).forEach(function (file) {
    if (file !== 'index.js' && file !== 'index.ts' && !isBuildMetaFile(file)) {
        // eslint-disable-next-line security/detect-non-literal-require
        FEATURES_LIST.push(require(`./${file}`).default);
    }
});
exports.default = FEATURES_LIST;
