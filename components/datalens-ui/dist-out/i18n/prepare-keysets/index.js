"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const prepare_keysets_1 = require("./prepare-keysets");
const prepare = async () => {
    await (0, prepare_keysets_1.prepareKeysets)('src/i18n-keysets');
    await fs_1.default.promises.mkdir(constants_1.I18N_TYPES_PATH, { recursive: true });
    await fs_1.default.promises.copyFile(path_1.default.join(constants_1.I18N_DEST_PATH, constants_1.I18N_TYPES_FILE), path_1.default.join(constants_1.I18N_TYPES_PATH, constants_1.I18N_TYPES_FILE));
};
prepare().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err.stack || err);
    process.exit(1);
});
