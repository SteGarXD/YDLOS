"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initI18n = initI18n;
const i18n_1 = require("@gravity-ui/i18n");
// ***
// I18N - used to install a new language for an instance
// I18n - factory for creating curried functions based on a keyset
// i18n - a function with a full set of parameters
// ***
function initI18n(locale) {
    const i18nInstance = new i18n_1.I18N();
    if (Array.isArray(locale)) {
        locale.forEach(({ lang, content }) => {
            if (content) {
                i18nInstance.registerKeysets(lang, content);
            }
            else {
                i18nInstance.registerKeyset(lang, 'empty', {});
            }
        });
        if (locale.length > 0) {
            i18nInstance.setLang(locale[0].lang);
        }
    }
    else {
        if (locale.content) {
            i18nInstance.registerKeysets(locale.lang, locale.content);
        }
        else {
            i18nInstance.registerKeyset(locale.lang, 'empty', {});
        }
        i18nInstance.setLang(locale.lang);
    }
    const i18n = i18nInstance.i18n.bind(i18nInstance);
    const i18nFactoryTyped = i18nInstance;
    return { I18N: i18nInstance, I18n: i18nFactoryTyped, i18n };
}
