"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nInstance = void 0;
exports.makeInstance = makeInstance;
const i18n_1 = require("@gravity-ui/i18n");
const i18nInstance = new i18n_1.I18N();
exports.i18nInstance = i18nInstance;
// equivalent of the previous behavior (undefined -> 'ru')
const defaultLang = 'ru';
i18nInstance.setLang(defaultLang);
function makeInstance(keysetName, keysetsData) {
    Object.entries(keysetsData).forEach(([key, value]) => i18nInstance.registerKeysets(key, value));
    return i18nInstance.i18n.bind(i18nInstance, keysetName);
}
