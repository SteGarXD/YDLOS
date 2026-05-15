"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartApiContext = getChartApiContext;
const language_1 = require("../../../../../shared/modules/language");
const language_2 = require("../../../../utils/language");
const chart_api_context_1 = require("../processor/chart-api-context");
const DEFAULT_USER_LANG = 'ru';
function getChartApiContext(args) {
    const context = (0, chart_api_context_1.getChartApiContext)(args);
    const i18n = (0, language_2.createI18nInstance)({ lang: args.userLang || DEFAULT_USER_LANG });
    context.ChartEditor.getTranslation = (0, language_1.getTranslationFn)(i18n.getI18nServer());
    return context;
}
