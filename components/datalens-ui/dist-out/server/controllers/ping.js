"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = ping;
const registry_1 = require("../registry");
const shared_1 = require("../../shared");
async function ping(req, res) {
    var r = req;
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    if (r.query['encodeId']) {
        const result = await gatewayApi.us.encodeId({
            ctx: req.ctx,
            headers: {
                ...req.headers,
                [shared_1.RPC_AUTHORIZATION]: r.query[shared_1.RPC_AUTHORIZATION]
            },
            requestId: req.id,
            args: { id: r.query['encodeId'] },
        });
        res.status(200).send(result.responseData);
    }
    else if (r.query['decodeId']) {
        const result = await gatewayApi.us.decodeId({
            ctx: req.ctx,
            headers: {
                ...req.headers,
                [shared_1.RPC_AUTHORIZATION]: r.query[shared_1.RPC_AUTHORIZATION]
            },
            requestId: req.id,
            args: { id: r.query['decodeId'] },
        });
        res.status(200).send(result.responseData.toString());
    }
    else {
        res.status(200).send('pong');
    }
}
