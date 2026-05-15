import type {AppRoutes} from '@gravity-ui/expresskit';
import {ExpressKit} from '@gravity-ui/expresskit';
import type {NodeKit} from '@gravity-ui/nodekit';

import US from './components/sdk/us';
import type {ExtendedAppRouteDescription} from './types/controllers';

const {auth} = require('express-openid-connect');

export function getExpressKit({
    extendedRoutes,
    nodekit,
}: {
    extendedRoutes: Record<string, ExtendedAppRouteDescription>;
    nodekit: NodeKit;
}) {
    const routes: AppRoutes = {};
    Object.keys(extendedRoutes).forEach((key) => {
        const {route, guard, ...params} = extendedRoutes[key];
        if (guard) {
            params.afterAuth = [...params.afterAuth, guard];
        }
        routes[route] = params;
    });

    const expressKit = new ExpressKit(nodekit, routes);

    const oidc_suffix = ['', '_2', '_3', '_4'];

    for (let i = 0; i < oidc_suffix.length; i++) {
        const config: any = nodekit.config;
        const enabled = config['oidc' + oidc_suffix[i]];
        const secret = config['oidc_secret' + oidc_suffix[i]];

        // Без корректного secret express-openid-connect падает на старте.
        // В dev-режиме просто пропускаем такой OIDC-конфиг, чтобы не валить весь сервер.
        if (enabled && typeof secret === 'string' && secret.length > 0) {
            const oidcRoutes = auth({
                issuerBaseURL: config['oidc_issuer' + oidc_suffix[i]],
                baseURL: config['oidc_base_url' + oidc_suffix[i]],
                clientID: config['oidc_client_id' + oidc_suffix[i]],
                secret: secret,
                clientSecret: secret,
                idpLogout: true,
                authorizationParams: {
                    response_type: 'code',
                    scope: 'openid email profile',
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
                const r: any = req;

                if (await r.oidc.isAuthenticated()) {
                    const token: string = r.oidc.accessToken.access_token;
                    const user = await r.oidc.user;
                    const result = await US.oidcAuth(
                        {
                            login: user.sub,
                            token: token,
                            data: Buffer.from(JSON.stringify(user)).toString('base64'),
                        },
                        req.ctx,
                    );
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
