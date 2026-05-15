import type {Request, Response} from '@gravity-ui/expresskit';

import {
    AUTH_COOKIE_NAME,
    AUTH_EXP_COOKIE_NAME,
} from '../../../shared/components/auth/constants/cookie';
import {registry} from '../../registry';

const AUTH_COOKIE_MAX_AGE_SEC = 24 * 60 * 60; // 24 часа

/** Рекурсивный поиск строкового поля token в объекте (глубина до 4 уровней). */
function findTokenDeep(obj: unknown, depth: number): string | undefined {
    if (depth <= 0 || obj === null || obj === undefined) return undefined;
    if (typeof obj === 'string') return undefined;
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const t = findTokenDeep(item, depth - 1);
            if (t) return t;
        }
        return undefined;
    }
    if (typeof obj === 'object') {
        const rec = obj as Record<string, unknown>;
        const t = rec.token ?? rec.accessToken ?? rec.access_token;
        if (typeof t === 'string' && t.length > 0) return t;
        for (const key of Object.keys(rec)) {
            const t2 = findTokenDeep(rec[key], depth - 1);
            if (t2) return t2;
        }
    }
    return undefined;
}

function extractToken(body: unknown): string | undefined {
    if (body === null || body === undefined) return undefined;
    if (typeof body === 'string') {
        try {
            return extractToken(JSON.parse(body) as unknown);
        } catch {
            return undefined;
        }
    }
    if (Array.isArray(body) && body.length && typeof body[0] === 'object' && body[0] !== null) {
        const t = (body[0] as Record<string, unknown>).token;
        if (typeof t === 'string') return t;
    }
    const data =
        typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
    if (!data) return undefined;
    const t = data.token ?? data.accessToken ?? data.access_token;
    if (typeof t === 'string') return t;
    const inner =
        data.data && typeof data.data === 'object' ? (data.data as Record<string, unknown>) : null;
    if (inner && typeof (inner.token ?? inner.accessToken ?? inner.access_token) === 'string')
        return String(inner.token ?? inner.accessToken ?? inner.access_token);
    const result =
        data.result && typeof data.result === 'object'
            ? (data.result as Record<string, unknown>)
            : null;
    if (
        result &&
        typeof (result.token ?? (result as Record<string, unknown>).accessToken) === 'string'
    )
        return String(result.token ?? (result as Record<string, unknown>).accessToken);
    const resultData =
        result && result.data && typeof result.data === 'object'
            ? (result.data as Record<string, unknown>)
            : null;
    if (resultData && typeof resultData.token === 'string') return resultData.token;
    return findTokenDeep(body, 4);
}

/**
 * Оборачивает gateway controller для auth: при успешном signin (ответ с token от us-auth /auth)
 * выставляет куки auth и auth_exp, чтобы платформа считала пользователя авторизованным.
 * Контракт akrasnov87/us-auth: POST /demo/auth → 200 { token, user, projectId } (без Set-Cookie).
 */
/** Из пути /api/gateway/auth/auth/signin или /gateway/auth/auth/refreshToken достаём scope, service, action для gateway. */
function ensureAuthParams(req: Request) {
    if (req.params.scope && req.params.service) return;
    // Path segments are bounded; optional third segment may be absent.
    // eslint-disable-next-line security/detect-unsafe-regex -- bounded URL path, not user-controlled unbounded input
    const match = req.path.match(/^(?:\/api)?\/gateway\/([^/]+)\/([^/]+)\/([^/]+)?\/?$/);
    if (match) {
        (req.params as Record<string, string>).scope = match[1];
        (req.params as Record<string, string>).service = match[2];
        if (match[3]) (req.params as Record<string, string>).action = match[3];
    }
}

export function getAuthGatewayHandler() {
    const {gatewayController} = registry.getGatewayController();

    return (req: Request, res: Response) => {
        ensureAuthParams(req);
        const isSignin =
            req.params.scope === 'auth' &&
            (req.params.action === 'signin' || req.path.endsWith('/signin'));

        if (isSignin) {
            // Образ us-auth ожидает body.UserName и body.Password. Клиент может отправлять login/password — всегда подставляем оба формата.
            const body = req.body as Record<string, unknown> | undefined;
            if (body && typeof body === 'object') {
                const login = body.login ?? body.UserName;
                const password = body.password ?? body.Password;
                const hasLogin = login !== undefined && login !== null;
                const hasPassword = password !== undefined && password !== null;
                if (hasLogin) body.UserName = login;
                if (hasPassword) body.Password = password;
            }
            // Gateway вызывает res.send(responseData), не res.json — оборачиваем оба, чтобы выставить куки при 200.
            const setCookieIfToken = (body: unknown) => {
                const token = extractToken(body);
                if (token && typeof token === 'string') {
                    const exp = Math.floor(Date.now() / 1000) + AUTH_COOKIE_MAX_AGE_SEC;
                    const opts = {
                        httpOnly: true,
                        path: '/',
                        maxAge: AUTH_COOKIE_MAX_AGE_SEC * 1000,
                        sameSite: 'lax' as const,
                    };
                    // api-auth ожидает куку как JSON с полем accessToken; при отсутствии заголовка x-rpc-authorization парсит куку и верифицирует JWT
                    res.cookie(AUTH_COOKIE_NAME, JSON.stringify({accessToken: token}), opts);
                    res.cookie(AUTH_EXP_COOKIE_NAME, String(exp), opts);
                }
            };
            const isHtmlOrNoToken = (body: unknown): boolean => {
                if (body === null || body === undefined) return true;
                if (
                    typeof body === 'string' &&
                    (body.trim().startsWith('<') ||
                        (body.length > 0 && !body.trim().startsWith('{')))
                )
                    return true;
                const token = extractToken(body);
                return !token;
            };
            const originalSend = res.send.bind(res);
            const originalJson = res.json.bind(res);
            const send401 = () => {
                if (!res.headersSent)
                    res.status(401)
                        .setHeader('Content-Type', 'application/json')
                        .end(
                            JSON.stringify({
                                error: {
                                    code: 'UNAUTHORIZED',
                                    message: 'Invalid login or response from auth service',
                                    status: 401,
                                },
                            }),
                        );
            };
            res.send = function (body: unknown) {
                setCookieIfToken(body);
                if (res.statusCode === 200 && isHtmlOrNoToken(body)) {
                    send401();
                    return res;
                }
                return originalSend(body);
            };
            res.json = function (body: unknown) {
                setCookieIfToken(body);
                if (res.statusCode === 200 && isHtmlOrNoToken(body)) {
                    send401();
                    return res;
                }
                return originalJson(body);
            };
        }

        gatewayController(req, res);
    };
}
