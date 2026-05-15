"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartsController = exports.prepareCreateParams = void 0;
exports.prepareChartData = prepareChartData;
const shared_1 = require("../../../../shared");
const types_1 = require("../../../../shared/types");
const utils_1 = __importDefault(require("../../../utils"));
const chart_generator_1 = require("../components/chart-generator");
const chart_validator_1 = require("../components/chart-validator");
const provider_1 = require("../components/storage/united-storage/provider");
function responseWithError({ error, defaultMessage, req, res, }) {
    const { ctx } = req;
    let readableError = { error: defaultMessage };
    const { response } = error;
    let status = 500;
    if (response) {
        if (response.data) {
            readableError = response.data;
        }
        status = response.status;
    }
    ctx.logError('FAILED_TO_HANDLE_CHART', error);
    res.status(status).send(readableError);
}
function prepareChartData({ data, template, type }, req) {
    const { ctx } = req;
    let chart, links;
    try {
        if (typeof template !== 'undefined') {
            ({ chart, type, links } = chart_generator_1.chartGenerator.generateChart({ data, template, req, ctx }));
            // Convert from wizard to editor script
            if (data.convert) {
                type = type.replace(/_wizard/, '');
            }
            else {
                chart = { shared: chart.shared };
            }
        }
        else if (type) {
            if (chart_validator_1.chartValidator.validate({ data, type })) {
                chart = data;
            }
            else {
                throw new Error('Cannot create chart: invalid tabs for specified type');
            }
        }
        else {
            throw new Error('Cannot create chart: template/type required in body');
        }
    }
    catch (error) {
        ctx.logError('FAILED_TO_PREPARE_CHART_DATA', error);
        return { error: error };
    }
    return { chart, type, links, template };
}
const getHeaders = (req) => {
    const headers = {
        ...req.headers,
        ...(req.ctx.config.isZitadelEnabled ? { ...utils_1.default.pickZitadelHeaders(req) } : {}),
        ...(req.headers['x-rpc-authorization'] ? { 'x-request-id': ('{{' + req.headers['x-rpc-authorization'] + '}}.' + req.headers['x-request-id']) } : {}),
        ...(req.ctx.config.isAuthEnabled ? { ...utils_1.default.pickAuthHeaders(req) } : {}),
    };
    return headers;
};
const prepareCreateParams = async (chartData, req) => {
    var _a;
    const { chart, type, links, template } = chartData;
    const { key, name, workbookId, description = '', annotation } = req.body;
    // If we save editor script
    if (typeof template === 'undefined') {
        const { checkRequestForDeveloperModeAccess } = req.ctx.get('gateway');
        const checkResult = await checkRequestForDeveloperModeAccess({ ctx: req.ctx });
        if (checkResult === types_1.DeveloperModeCheckStatus.Forbidden) {
            return;
        }
    }
    const createParams = {
        key,
        name,
        workbookId,
        data: chart,
        type,
        scope: 'widget',
        headers: getHeaders(req),
        includePermissionsInfo: true,
        annotation: {
            description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
        },
    };
    if (links) {
        createParams.links = links;
    }
    return createParams;
};
exports.prepareCreateParams = prepareCreateParams;
const chartsController = (_chartsEngine) => {
    return {
        create: async (req, res) => {
            const { ctx } = req;
            const chartData = prepareChartData(req.body, req);
            if (chartData.error) {
                res.status(400).send({
                    error: chartData.error.message,
                });
                return;
            }
            const createParams = await (0, exports.prepareCreateParams)(chartData, req);
            if (!createParams) {
                res.status(403).send({
                    error: {
                        code: 403,
                        details: {
                            message: 'Access to Editor developer mode was denied',
                        },
                    },
                });
                return;
            }
            provider_1.USProvider.create(ctx, createParams)
                .then((result) => {
                res.send({
                    ...result,
                });
            })
                .catch((error) => {
                responseWithError({
                    error,
                    defaultMessage: 'Failed to create chart',
                    req,
                    res,
                });
            });
        },
        update: async (req, res) => {
            var _a;
            const { ctx } = req;
            const chartData = prepareChartData(req.body, req);
            if (chartData.error) {
                res.status(400).send({
                    error: chartData.error.message,
                });
                return;
            }
            const { chart, type, links, template } = chartData;
            // If we save editor script
            if (typeof template === 'undefined') {
                const { checkRequestForDeveloperModeAccess } = req.ctx.get('gateway');
                const checkResult = await checkRequestForDeveloperModeAccess({ ctx: req.ctx });
                if (checkResult === types_1.DeveloperModeCheckStatus.Forbidden) {
                    res.status(403).send({
                        error: {
                            code: 403,
                            details: {
                                message: 'Access to Editor developer mode was denied',
                            },
                        },
                    });
                    return;
                }
            }
            const entryId = req.params.entryId;
            const { mode, annotation, description = '' } = req.body;
            const updateParams = {
                entryId,
                mode,
                type,
                data: chart,
                headers: getHeaders(req),
                annotation: {
                    description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                },
            };
            if (links) {
                updateParams.links = links;
            }
            if (mode !== shared_1.EntryUpdateMode.Publish) {
                updateParams.skipSyncLinks = true;
            }
            provider_1.USProvider.update(ctx, updateParams)
                .then((result) => {
                res.send({
                    ...result,
                });
            })
                .catch((error) => {
                responseWithError({
                    error,
                    defaultMessage: 'Failed to update chart',
                    req,
                    res,
                });
            });
        },
        get: (req, res) => {
            const { ctx } = req;
            const { entryId } = req.params;
            const { unreleased, includeLinks, includePermissionsInfo, revId } = req.query;
            provider_1.USProvider.retrieveById(ctx, {
                id: entryId,
                revId: revId,
                unreleased: unreleased,
                includeLinks: includeLinks,
                includePermissionsInfo: includePermissionsInfo,
                headers: getHeaders(req),
            })
                .then((result) => {
                let chartData;
                if (result.type.includes('wizard_node')) {
                    try {
                        chartData = JSON.parse(result.data.shared);
                    }
                    catch (e) {
                        chartData = {};
                    }
                }
                else {
                    chartData = result.data;
                }
                result.data = chartData;
                res.send(result);
            })
                .catch((error) => {
                responseWithError({
                    error,
                    defaultMessage: 'Failed to get chart',
                    req,
                    res,
                });
            });
        },
        delete: (req, res) => {
            const { ctx } = req;
            const entryId = req.params.entryId;
            provider_1.USProvider.delete(ctx, {
                id: entryId,
                headers: getHeaders(req),
            })
                .then(() => {
                res.status(200).send();
            })
                .catch((error) => {
                responseWithError({
                    error,
                    defaultMessage: 'Failed to delete chart',
                    req,
                    res,
                });
            });
        },
        entryByKey: (req, res) => {
            const { ctx } = req;
            const key = req.query.key || '';
            provider_1.USProvider.retrieveByKey(ctx, {
                key,
                unreleased: true,
                headers: getHeaders(req),
            })
                .then((result) => {
                res.send(result);
            })
                .catch((error) => {
                responseWithError({
                    error,
                    defaultMessage: 'Failed to retrieve entry by key',
                    req,
                    res,
                });
            });
        },
    };
};
exports.chartsController = chartsController;
