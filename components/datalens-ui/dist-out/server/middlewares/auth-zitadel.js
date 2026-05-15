"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const callbacks_1 = require("../callbacks");
const utils_1 = require("../components/zitadel/utils");
const zitadel_1 = require("../controllers/zitadel");
async function authZitadel(req, res, next) {
    var _a, _b;
    const { ctx } = req;
    const isAuthenticated = req.isAuthenticated();
    if (isAuthenticated) {
        req.originalContext.set('userId', req.user.userId);
        req.serviceUserAccessToken = await (0, utils_1.generateServiceAccessUserToken)(ctx, req.user.userId);
        const accessToken = req.user.accessToken;
        const refreshToken = req.user.refreshToken;
        let introspectResult = await (0, utils_1.introspect)(ctx, accessToken);
        if (introspectResult.active) {
            (0, utils_1.saveUserToLocals)(res, introspectResult);
            return next();
        }
        else {
            const tokensFirstTrial = await (0, utils_1.refreshTokens)(ctx, refreshToken);
            const tokens = { accessToken: undefined, refreshToken: undefined };
            if (tokensFirstTrial.accessToken && tokensFirstTrial.refreshToken) {
                // second trial should be deleted as soon as Zitadel fixes mutliple invalid refresh tokens issuing in parallel: CHARTS-9774
                const tokensSecondTrial = await (0, utils_1.refreshTokens)(ctx, tokensFirstTrial.refreshToken);
                if (tokensSecondTrial.accessToken && tokensSecondTrial.refreshToken) {
                    tokens.accessToken = tokensSecondTrial.accessToken;
                    tokens.refreshToken = tokensSecondTrial.refreshToken;
                }
            }
            if (tokens.accessToken && tokens.refreshToken) {
                req.user.accessToken = tokens.accessToken;
                req.user.refreshToken = tokens.refreshToken;
                await (0, utils_1.saveUserToSession)(req);
                introspectResult = await (0, utils_1.introspect)(ctx, req.user.accessToken);
                if (introspectResult.active) {
                    (0, utils_1.saveUserToLocals)(res, introspectResult);
                    return next();
                }
            }
            if ((_a = req.routeInfo) === null || _a === void 0 ? void 0 : _a.ui) {
                try {
                    return (0, zitadel_1.logout)(req, res);
                }
                catch (e) {
                    req.ctx.logError('logout', e);
                    throw e;
                }
            }
            return res.status(498).send('Unauthorized access');
        }
    }
    if (req.path === '/auth' || req.path === '/api/auth/callback') {
        return next();
    }
    const apiRoute = Boolean(!((_b = req.routeInfo) === null || _b === void 0 ? void 0 : _b.ui));
    if (apiRoute) {
        return res.status(498).send('Unauthorized access');
    }
    return res.redirect('/auth');
}
async function default_1(req, res, next) {
    return authZitadel(req, res, next)
        .catch((error) => {
        req.ctx.logError('AUTH_ZITADEL_FAILED', error);
        (0, callbacks_1.defaultOnFail)(req, res);
    })
        .catch((error) => next(error));
}
