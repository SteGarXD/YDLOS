"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareKeysets = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../constants");
const constants_2 = require("./constants");
const utils_1 = require("./utils");
const prepareKeysets = async (keysetsDir) => {
    await (0, utils_1.clearFiles)(constants_1.I18N_DEST_PATH);
    const keysets = await (0, utils_1.getKeysets)(keysetsDir);
    const writePromises = [];
    for (const lang of constants_2.KEYSET_LANGUAGES) {
        const typeFileName = lang === constants_2.LANG_FOR_TYPES ? constants_1.I18N_TYPES_FILE : undefined;
        const keysetData = (0, utils_1.prepareKeysetData)({ lang, keysets, typeFileName });
        for (const dataItem of keysetData) {
            const JSONContent = JSON.stringify(dataItem.keyset, null, 4);
            if (dataItem.filename === constants_1.I18N_TYPES_FILE) {
                writePromises.push({
                    filename: dataItem.filename,
                    promise: fs_1.default.promises.writeFile(path_1.default.resolve(constants_1.I18N_DEST_PATH, dataItem.filename), JSONContent, { encoding: 'utf-8' }),
                });
            }
            else {
                const content = (0, utils_1.umdTemplate)(JSONContent, constants_1.GLOBAL_I18N_VAR);
                const JSFileName = (0, utils_1.getJSFileName)(dataItem.filename, JSONContent);
                writePromises.push({
                    filename: JSFileName,
                    promise: fs_1.default.promises.writeFile(path_1.default.resolve(constants_1.I18N_DEST_PATH, JSFileName), content, { encoding: 'utf-8' }),
                });
            }
        }
    }
    await Promise.all(writePromises.map(({ promise }) => promise));
};
exports.prepareKeysets = prepareKeysets;
