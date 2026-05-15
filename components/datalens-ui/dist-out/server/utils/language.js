"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createI18nInstance = exports.keysetsByLang = void 0;
exports.addTranslationsScript = addTranslationsScript;
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../../i18n/constants");
const read_keysets_1 = require("../../i18n/read-keysets");
const utils_1 = require("../../i18n/utils");
exports.keysetsByLang = lodash_1.default.memoize(() => Object.entries((0, read_keysets_1.readKeysets)(constants_1.I18N_DEST_PATH)).reduce((acc, [key, keyset]) => {
    // eslint-disable-next-line security/detect-non-literal-require, global-require
    const content = require(path_1.default.resolve(constants_1.I18N_DEST_PATH, keyset.filename));
    acc[key] = {
        filename: keyset.filename,
        content,
    };
    return acc;
}, {}));
function addTranslationsScript({ publicPath = '/build/', allowLanguages = [], lang, region, }) {
    const allowedLang = allowLanguages.includes(lang) ? lang : allowLanguages[0];
    const fileKey = region ? `${allowedLang}-${region}` : `${allowedLang}`;
    const keysetFile = (0, exports.keysetsByLang)()[fileKey];
    return {
        src: keysetFile ? `${publicPath}i18n/${keysetFile.filename}` : '',
        defer: true,
        crossOrigin: 'anonymous',
    };
}
const i18nInstanceByLang = {};
const createI18nInstance = (
// in some cases we need mutate lang value for i18n.
// for example, we first set i18n in before-auth-default middleware
// but later the lang can be changed in other middlewares
langSettings) => {
    return {
        get lang() {
            return langSettings.lang;
        },
        getI18nServer() {
            if (this.lang && !i18nInstanceByLang[this.lang]) {
                const data = (0, exports.keysetsByLang)()[this.lang] || { content: {} };
                const { I18n: i18nServer } = (0, utils_1.initI18n)({ lang: this.lang, content: data.content });
                i18nInstanceByLang[this.lang] = i18nServer;
            }
            return i18nInstanceByLang[this.lang];
        },
        keyset(keysetName) {
            return this.getI18nServer().keyset(keysetName);
        },
    };
};
exports.createI18nInstance = createI18nInstance;
