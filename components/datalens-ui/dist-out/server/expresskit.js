"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpressKit = getExpressKit;
const expresskit_1 = require("@gravity-ui/expresskit");
const us_1 = __importDefault(require("./components/sdk/us"));
const { auth } = require('express-openid-connect');
function getExpressKit({ extendedRoutes, nodekit, }) {
    const routes = {};
    Object.keys(extendedRoutes).forEach((key) => {
        const { route, guard, ...params } = extendedRoutes[key];
        if (guard) {
            params.afterAuth = [...params.afterAuth, guard];
        }
        routes[route] = params;
    });
    var expressKit = new expresskit_1.ExpressKit(nodekit, routes);
    var oidc_suffix = ['', '_2', '_3', '_4'];
    for (var i = 0; i < oidc_suffix.length; i++) {
        var config = nodekit.config;
        if (config['oidc' + oidc_suffix[i]]) {
            var oidcRoutes = auth({
                issuerBaseURL: config['oidc_issuer' + oidc_suffix[i]],
                baseURL: config['oidc_base_url' + oidc_suffix[i]],
                clientID: config['oidc_client_id' + oidc_suffix[i]],
                secret: config['oidc_secret' + oidc_suffix[i]],
                clientSecret: config['oidc_secret' + oidc_suffix[i]],
                idpLogout: true,
                authorizationParams: {
                    response_type: 'code',
                    scope: 'openid email profile'
                },
            });
            expressKit.express.get(`/auth/v${i + 1}/oidc/callback`, async (req, res, next) => {
                if (req.query['error'] == 'access_denied') {
                    res.redirect(`/?x-rpc-authorization=`);
                }
                next();
            });
            expressKit.express.use(`/auth/v${i + 1}/oidc`, oidcRoutes);
            expressKit.express.get(`/auth/v${i + 1}/oidc`, async (req, res, next) => {
                var r = req;
                if (await r.oidc.isAuthenticated()) {
                    const token = r.oidc.accessToken.access_token;
                    const user = await r.oidc.user;
                    var result = await us_1.default.oidcAuth({ "login": user.sub, "token": token, "data": Buffer.from(JSON.stringify(user)).toString('base64') }, req.ctx);
                    if (result && result.data) {
                        return res.redirect(`/?x-rpc-authorization=${result.data.token}`);
                    }
                }
                next();
            });
        }
    }
    return expressKit;
}
