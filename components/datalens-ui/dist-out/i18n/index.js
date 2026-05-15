"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = exports.I18n = exports.I18N = exports.lang = void 0;
const constants_1 = require("./constants");
const utils_1 = require("./utils");
const isBrowserEnv = typeof window === 'object';
const isJestEnv = typeof jest !== 'undefined';
exports.lang = 
// @ts-ignore avoid `window.d.ts` import because of too many ui types relations
isBrowserEnv ? window.DL.user.lang || 'en' : 'en';
let i18nPrepared;
if (isBrowserEnv && !isJestEnv) {
    // @ts-ignore ignore `window` string index
    i18nPrepared = (0, utils_1.initI18n)({ lang: exports.lang, content: window[constants_1.GLOBAL_I18N_VAR] || {} });
}
else {
    // empty keysets for jest (mock i18n as needed)
    i18nPrepared = (0, utils_1.initI18n)([{ lang: 'ru' }, { lang: 'en' }]);
}
exports.I18N = i18nPrepared.I18N;
exports.I18n = i18nPrepared.I18n;
exports.i18n = i18nPrepared.i18n;
