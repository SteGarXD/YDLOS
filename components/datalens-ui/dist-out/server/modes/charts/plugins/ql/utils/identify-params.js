"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyParams = identifyParams;
const shared_1 = require("../../../../../../shared");
const ql_1 = require("../../../../../../shared/modules/config/ql");
function identifyParams(args) {
    const { chart, getTranslation } = args;
    const config = (0, ql_1.mapQlConfigToLatestVersion)(chart, {
        i18n: getTranslation,
    });
    const { chartType, params } = config;
    const availableParams = {};
    if (params) {
        params.forEach((param) => {
            if (param.type.includes('interval') &&
                typeof param.defaultValue === 'object' &&
                param.defaultValue !== null) {
                const fromName = `${param.name}_from`;
                const toName = `${param.name}_to`;
                availableParams[`${param.name}`] = '';
                availableParams[fromName] = '';
                availableParams[toName] = '';
            }
            else {
                availableParams[param.name] = String(param.defaultValue) || "";
            }
        });
    }
    if (chartType === shared_1.QLChartType.Monitoringql) {
        availableParams['interval'] = '';
    }
    return availableParams;
}
