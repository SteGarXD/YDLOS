"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getError = void 0;
const shared_1 = require("../../shared");
const getError = (req) => {
    const { ctx } = req;
    const serviceName = ctx.config.serviceName;
    const I18n = req.ctx.get('i18n');
    const i18n = I18n.keyset('datalens.landing.error');
    return {
        onFail: {
            errorType: shared_1.ErrorContentTypes.ERROR,
            title: i18n('label_title-fail'),
            description: i18n('label_description-fail'),
            pageTitle: `${i18n('label_page-title-fail')} – ${serviceName}`,
        },
        onMissingEntry: {
            errorType: shared_1.ErrorContentTypes.NOT_FOUND,
            title: i18n('label_title-missing-entry'),
            pageTitle: `${i18n('label_page-title-missing-entry')} – ${serviceName}`,
        },
    };
};
exports.getError = getError;
