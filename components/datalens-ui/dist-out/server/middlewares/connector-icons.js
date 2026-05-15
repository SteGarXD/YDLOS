"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectorIconsMiddleware = getConnectorIconsMiddleware;
const merge_1 = __importDefault(require("lodash/merge"));
const registry_1 = require("../registry");
function getConnectorIconsMiddleware({ getAdditionalArgs, } = {}) {
    return async function connectorIconsMiddleware(req, res, next) {
        let icons = [];
        try {
            req.ctx.log('REQUEST_CONNECTOR_ITEMS');
            const { gatewayApi } = registry_1.registry.getGatewayApi();
            const actionArgs = {
                args: undefined,
                ctx: req.ctx,
                headers: { ...req.headers },
                requestId: req.id,
            };
            const additionalArgs = getAdditionalArgs === null || getAdditionalArgs === void 0 ? void 0 : getAdditionalArgs(req, res);
            if (additionalArgs) {
                (0, merge_1.default)(actionArgs, additionalArgs);
            }
            ({
                responseData: { icons },
            } = await gatewayApi.bi.listConnectorIcons(actionArgs));
        }
        catch (e) {
            req.ctx.logError('REQUEST_CONNECTOR_ITEMS_FAILED', e);
        }
        // eslint-disable-next-line no-param-reassign
        res.locals.connectorIcons = icons;
        next();
    };
}
