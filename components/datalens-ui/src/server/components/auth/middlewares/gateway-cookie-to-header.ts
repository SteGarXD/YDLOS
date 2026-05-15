import type {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {RPC_AUTHORIZATION} from '../../../../shared';
import {AUTH_COOKIE_NAME} from '../../../../shared/components/auth/constants/cookie';

/**
 * Для запросов к gateway (кроме /gateway/auth/): если в запросе нет токена в заголовках,
 * но есть кука auth — подставляем токен в x-rpc-authorization, чтобы api-auth его увидел.
 * Решает случай, когда браузер не отправляет заголовки (например, после редиректа).
 */
export function gatewayCookieToHeader(req: Request, _res: Response, next: NextFunction) {
    const path = (req.path || req.url || '').split('?')[0];
    if (!path.startsWith('/gateway/') || path.startsWith('/gateway/auth/')) {
        next();
        return;
    }
    const hasHeader =
        (req.headers[RPC_AUTHORIZATION] && String(req.headers[RPC_AUTHORIZATION]).trim()) ||
        (req.headers.authorization &&
            String(req.headers.authorization).trim().toLowerCase().startsWith('bearer '));
    if (hasHeader) {
        next();
        return;
    }
    const authCookie = req.cookies?.[AUTH_COOKIE_NAME];
    if (!authCookie || typeof authCookie !== 'string') {
        next();
        return;
    }
    let token: string | undefined;
    try {
        const parsed = JSON.parse(authCookie) as {accessToken?: string};
        token = parsed?.accessToken ?? (authCookie as string);
    } catch {
        token = authCookie as string;
    }
    if (token && typeof token === 'string' && token.length > 0) {
        (req.headers as Record<string, string>)[RPC_AUTHORIZATION] = token;
    }
    next();
}
