import {AuthPolicy} from '@gravity-ui/expresskit';

import type {ExtendedAppRouteDescription} from '../../types/controllers';

import {getAuthGatewayHandler} from './auth-gateway-handler';

export function getAuthRoutes({
    routeParams,
}: {
    routeParams: Omit<ExtendedAppRouteDescription, 'handler' | 'route'>;
}) {
    const handler = getAuthGatewayHandler();
    // Явные маршруты: без /api (SDK endpoint: '/gateway') и с /api (если baseURL или прокси дают /api)
    const routeList = [
        ['postAuthSignin', 'POST /gateway/auth/auth/signin' as const],
        ['postAuthRefreshTokens', 'POST /gateway/auth/auth/refreshTokens' as const],
        ['postAuthRefreshToken', 'POST /gateway/auth/auth/refreshToken' as const],
        ['postAuthRefreshTokensKebab', 'POST /gateway/auth/auth/refresh-tokens' as const],
        ['postAuthGateway', 'POST /gateway/:scope(auth)/:service/:action?' as const],
        ['postAuthSigninApi', 'POST /api/gateway/auth/auth/signin' as const],
        ['postAuthRefreshTokensApi', 'POST /api/gateway/auth/auth/refreshTokens' as const],
        ['postAuthRefreshTokenApi', 'POST /api/gateway/auth/auth/refreshToken' as const],
        ['postAuthRefreshTokensKebabApi', 'POST /api/gateway/auth/auth/refresh-tokens' as const],
        ['postAuthGatewayApi', 'POST /api/gateway/:scope(auth)/:service/:action?' as const],
    ] as const;
    const routes: Record<string, ExtendedAppRouteDescription> = {};
    for (const [key, route] of routeList) {
        routes[key] = {
            authPolicy: AuthPolicy.disabled,
            route,
            handler,
            ...routeParams,
        };
    }

    return routes;
}
