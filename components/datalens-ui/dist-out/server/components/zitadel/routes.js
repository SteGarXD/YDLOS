"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZitadelRoutes = getZitadelRoutes;
const expresskit_1 = require("@gravity-ui/expresskit");
const zitadel_1 = require("../../controllers/zitadel");
function getZitadelRoutes({ passport, beforeAuth, afterAuth, }) {
    const routes = {
        auth: {
            beforeAuth,
            afterAuth,
            authHandler: passport.authenticate('openidconnect'),
            route: 'GET /auth',
            handler: () => { },
        },
        authCallback: {
            beforeAuth,
            afterAuth,
            authHandler: passport.authenticate('openidconnect', {
                successRedirect: '/',
                failureRedirect: '/auth',
            }),
            route: 'GET /api/auth/callback',
            handler: () => { },
        },
        logout: {
            beforeAuth,
            afterAuth,
            route: 'GET /logout',
            handler: zitadel_1.logout,
            authPolicy: expresskit_1.AuthPolicy.disabled,
            ui: true,
        },
    };
    return routes;
}
