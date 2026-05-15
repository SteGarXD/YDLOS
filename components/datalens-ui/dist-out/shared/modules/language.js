"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTranslationFn = void 0;
const getTranslationFn = (i18n) => (keyset, key, params) => {
    return i18n.keyset(keyset)(key, params);
};
exports.getTranslationFn = getTranslationFn;
