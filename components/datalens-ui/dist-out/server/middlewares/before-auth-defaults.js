"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeAuthDefaults = beforeAuthDefaults;
const nodekit_1 = require("@gravity-ui/nodekit");
const language_1 = require("../utils/language");
async function beforeAuthDefaults(req, res, next) {
    res.locals.userSettings = {};
    res.locals.userSettings.language = req.ctx.get(nodekit_1.USER_LANGUAGE_PARAM_NAME);
    res.locals.lang = req.ctx.get(nodekit_1.USER_LANGUAGE_PARAM_NAME);
    // use `lang` from closure `res` object
    // maybe changed after user auth middleware and fill `userSettings`
    const i18n = (0, language_1.createI18nInstance)(res.locals);
    req.originalContext.set('i18n', i18n);
    next();
}
