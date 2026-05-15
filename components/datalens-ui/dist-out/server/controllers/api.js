"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiControllers = void 0;
const components_1 = require("../components");
const registry_1 = require("../registry");
exports.apiControllers = {
    deleteLock: async (req, res) => {
        try {
            const { entryId, params } = req.body;
            const { gatewayApi } = registry_1.registry.getGatewayApi();
            const { responseData } = await gatewayApi.us.deleteLock({
                authArgs: { iamToken: res.locals.iamToken },
                headers: components_1.Utils.pickHeaders(req),
                ctx: req.ctx,
                requestId: req.id,
                args: {
                    entryId,
                    params,
                },
            });
            res.status(200).send(responseData);
        }
        catch (ex) {
            const { error } = ex;
            res.status(error.status).send(error);
        }
    },
};
