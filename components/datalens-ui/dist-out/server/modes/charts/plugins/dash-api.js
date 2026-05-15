"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuredDashApiPlugin = configuredDashApiPlugin;
const nodekit_1 = require("@gravity-ui/nodekit");
const lodash_1 = require("lodash");
const pick_1 = __importDefault(require("lodash/pick"));
const shared_1 = require("../../../../shared");
const components_1 = require("../../../components");
const sdk_1 = require("../../../components/sdk");
const constants_1 = require("../../../constants");
function purgeResult(result) {
    return (0, pick_1.default)(result, constants_1.DASH_ENTRY_RELEVANT_FIELDS);
}
const getRoutes = (options) => {
    const { routeParams, privateRouteParams, validate, basePath = shared_1.DASH_API_BASE_URL, privatePath, } = options || {};
    let { validationConfig } = options || {};
    if (validate && !validationConfig) {
        validationConfig = validate;
    }
    let routes = [
        {
            method: 'POST',
            path: basePath,
            validationConfig,
            handlerName: 'dashAPIcreate',
            handler: async (req, res) => {
                try {
                    const { body, ctx } = req;
                    const I18n = req.ctx.get('i18n');
                    const result = await sdk_1.Dash.create(body, components_1.Utils.pickHeaders(req), ctx, I18n);
                    res.status(200).send(purgeResult(result));
                }
                catch (error) {
                    const errorCode = components_1.Utils.getErrorCode(error);
                    const errorStatus = errorCode === shared_1.ErrorCode.ReadOnlyMode ? 451 : 500;
                    res.status(errorStatus).send({
                        message: components_1.Utils.getErrorMessage(error),
                        details: components_1.Utils.getErrorDetails(error),
                        code: errorCode,
                    });
                    sendStats(req.ctx, 'dashAPIcreate', errorStatus);
                }
            },
            ...(routeParams || {}),
        },
        {
            method: 'GET',
            path: `${basePath}/:id`,
            handlerName: 'dashAPIget',
            handler: async (req, res) => {
                try {
                    const { params: { id }, query, ctx, } = req;
                    if (!id || id === 'null') {
                        res.status(404).send({ message: 'Dash not found' });
                        sendStats(req.ctx, 'dashAPIget', 404);
                        return;
                    }
                    const result = await sdk_1.Dash.read(id, query, components_1.Utils.pickHeaders(req), ctx);
                    if (result.scope !== shared_1.EntryScope.Dash) {
                        res.status(404).send({ message: 'No entry found' });
                        sendStats(req.ctx, 'dashAPIget', 404);
                        return;
                    }
                    res.status(200).send(purgeResult(result));
                }
                catch (error) {
                    const originalStatus = components_1.Utils.getErrorStatus(error);
                    const errorStatus = originalStatus && [400, 403, 404].includes(originalStatus)
                        ? originalStatus
                        : 500;
                    res.status(errorStatus).send({ message: components_1.Utils.getErrorMessage(error) });
                    sendStats(req.ctx, 'dashAPIget', errorStatus);
                }
            },
            ...(routeParams || {}),
        },
        {
            method: 'POST',
            path: `${basePath}/:id`,
            handlerName: 'dashAPIupdate',
            validationConfig,
            handler: async (req, res) => {
                try {
                    const { params: { id }, body, ctx, } = req;
                    const I18n = req.ctx.get('i18n');
                    const result = await sdk_1.Dash.update(id, body, components_1.Utils.pickHeaders(req), ctx, I18n);
                    res.status(200).send(purgeResult(result));
                }
                catch (error) {
                    let errorStatus = 500;
                    if (components_1.Utils.getErrorStatus(error) === 403) {
                        errorStatus = 403;
                    }
                    else if (components_1.Utils.getErrorCode(error) === shared_1.ErrorCode.ReadOnlyMode) {
                        errorStatus = 451;
                    }
                    res.status(errorStatus).send({ message: components_1.Utils.getErrorMessage(error) });
                    sendStats(req.ctx, 'dashAPIupdate', errorStatus);
                }
            },
            ...(routeParams || {}),
        },
        {
            method: 'DELETE',
            path: `${basePath}/:id`,
            handlerName: 'dashAPIdelete',
            handler: async (req, res) => {
                try {
                    const { params: { id }, ctx, } = req;
                    const result = await sdk_1.Dash.delete(id, components_1.Utils.pickHeaders(req), ctx);
                    res.status(200).send(purgeResult(result));
                }
                catch (error) {
                    let errorStatus = 500;
                    const originalStatus = components_1.Utils.getErrorStatus(error);
                    if (originalStatus === 403 || originalStatus === 423) {
                        errorStatus = originalStatus;
                    }
                    else if (components_1.Utils.getErrorCode(error) === shared_1.ErrorCode.ReadOnlyMode) {
                        errorStatus = 451;
                    }
                    res.status(errorStatus).send({ message: components_1.Utils.getErrorMessage(error) });
                    sendStats(req.ctx, 'dashAPIdelete', errorStatus);
                }
            },
            ...(routeParams || {}),
        },
    ];
    if (privatePath) {
        routes = routes.concat(routes.map((route) => {
            return {
                ...route,
                path: route.path.replace(basePath, privatePath),
                ...(privateRouteParams || {}),
            };
        }));
    }
    return routes;
};
function configuredDashApiPlugin(options) {
    return {
        routes: getRoutes(options),
    };
}
function sendStats(ctx, handlerName, status) {
    let userId = ctx.get(nodekit_1.USER_ID_PARAM_NAME) || '0';
    if ((0, lodash_1.isObject)(userId)) {
        userId = 'value' in userId ? userId.value : '0';
    }
    ctx.stats('dashApiErrors', {
        handlerName,
        timestamp: Date.now(),
        status,
        requestId: ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
        userId,
        traceId: ctx.getTraceId() || '',
    });
}
