"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPublicApiController = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const gateway_utils_1 = require("../../../shared/schema/gateway-utils");
const public_api_1 = require("../../components/public-api");
const registry_1 = require("../../registry");
const utils_1 = __importDefault(require("../../utils"));
const constants_1 = require("./constants");
const utils_2 = require("./utils");
const createPublicApiController = () => {
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const { baseConfig } = registry_1.registry.getPublicApiConfig();
    const schemasByScope = registry_1.registry.getGatewaySchemasByScope();
    const actionToPathMap = new Map();
    Object.entries(gatewayApi).forEach(([serviceName, actions]) => {
        Object.entries(actions).forEach(([actionName, action]) => {
            actionToPathMap.set(action, { serviceName, actionName });
        });
    });
    const actionToConfigMap = new Map();
    Object.values(baseConfig).forEach(({ actions, openApi: versionOpenApi }) => {
        Object.entries(actions).forEach(([actionName, { resolve, openApi }]) => {
            const gatewayAction = resolve(gatewayApi);
            const pathObject = actionToPathMap.get(gatewayAction);
            if (!pathObject) {
                throw new nodekit_1.AppError(`Public api config action "${actionName}" not found in gatewayApi.`);
            }
            const actionConfig = schemasByScope.root[pathObject.serviceName].actions[pathObject.actionName];
            actionToConfigMap.set(gatewayAction, actionConfig);
            (0, public_api_1.registerActionToOpenApi)({
                actionConfig,
                actionName,
                openApi,
                openApiRegistry: versionOpenApi.registry,
            });
        });
    });
    return async function publicApiController(req, res) {
        try {
            const { action: actionName } = req.params;
            const version = (0, utils_2.parseRequestApiVersion)(req);
            if (!actionName || !baseConfig[version].actions[actionName]) {
                throw new constants_1.PublicApiError(`Endpoint ${req.path} does not exist`, {
                    code: constants_1.PUBLIC_API_ERRORS.ENDPOINT_NOT_FOUND,
                });
            }
            const action = baseConfig[version].actions[actionName];
            const { ctx } = req;
            const headers = utils_1.default.pickPublicApiHeaders(req);
            const requestId = ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '';
            const gatewayAction = action.resolve(gatewayApi);
            const gatewayActionConfig = actionToConfigMap.get(gatewayAction);
            if (!gatewayActionConfig) {
                req.ctx.logError(`Couldn't find action config in actionToConfigMap`);
                throw new constants_1.PublicApiError(constants_1.PUBLIC_API_ERRORS.ACTION_CONFIG_NOT_FOUND, {
                    code: constants_1.PUBLIC_API_ERRORS.ACTION_CONFIG_NOT_FOUND,
                });
            }
            const validationSchema = (0, gateway_utils_1.getValidationSchema)(gatewayActionConfig);
            if (!validationSchema) {
                req.ctx.logError(`Couldn't find action validation schema [${actionName}]`);
                throw new constants_1.PublicApiError(constants_1.PUBLIC_API_ERRORS.ACTION_VALIDATION_SCHEMA_NOT_FOUND, {
                    code: constants_1.PUBLIC_API_ERRORS.ACTION_VALIDATION_SCHEMA_NOT_FOUND,
                });
            }
            const { paramsSchema } = validationSchema;
            const validatedArgs = paramsSchema
                ? await (0, utils_2.validateRequestBody)(paramsSchema, req.body)
                : undefined;
            const result = await gatewayAction({
                headers,
                args: validatedArgs,
                ctx,
                requestId,
            });
            res.status(200).send(result.responseData);
        }
        catch (err) {
            const { status, message, code, details } = (0, utils_2.prepareError)(err);
            res.status(status).send({
                status,
                code,
                message,
                requestId: req.ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '',
                details,
            });
        }
    };
};
exports.createPublicApiController = createPublicApiController;
