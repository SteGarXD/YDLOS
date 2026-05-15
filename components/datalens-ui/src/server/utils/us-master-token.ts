import type {IncomingHttpHeaders} from 'http';

import type {AppContext} from '@gravity-ui/nodekit';

import {AppInstallation} from '../../shared/constants/common';
import {US_MASTER_TOKEN_HEADER} from '../../shared/constants/header';

/**
 * Значение master-токена для United Storage (как в gateway.ts proxyHeaders).
 */
export function getUsMasterTokenValue(ctx: AppContext): string {
    const cfg = ctx.config as {usMasterToken?: string};
    return (cfg.usMasterToken as string) || process.env.US_MASTER_TOKEN || 'us-master-token';
}

/**
 * Условия совпадают с {@link getGatewayConfig} proxyHeaders для x-us-master-token:
 * opensource, явный токен в конфиге/env, или development.
 */
export function shouldAttachUsMasterToken(ctx: AppContext): boolean {
    const cfg = ctx.config as {usMasterToken?: string; appInstallation?: string; appEnv?: string};
    const installationType = process.env.APP_INSTALLATION ?? cfg.appInstallation;
    const isOpensource = installationType === AppInstallation.Opensource;
    const isDev = cfg.appEnv === 'development' || process.env.APP_ENV === 'development';

    return (
        isOpensource || Boolean(cfg.usMasterToken) || Boolean(process.env.US_MASTER_TOKEN) || isDev
    );
}

/**
 * Добавляет x-us-master-token к исходящим запросам к US, если того требует инсталляция.
 * Всегда подставляет токен из конфига/окружения сервера (как gateway и united-storage injectMetadata),
 * чтобы не использовать «дефолт» из браузера (us-master-token), если в US задан другой US_MASTER_TOKEN.
 */
export function mergeUsMasterTokenHeader(
    headers: IncomingHttpHeaders | undefined,
    ctx: AppContext,
): IncomingHttpHeaders {
    if (!shouldAttachUsMasterToken(ctx)) {
        return headers || {};
    }
    return {
        ...(headers || {}),
        [US_MASTER_TOKEN_HEADER]: getUsMasterTokenValue(ctx),
    };
}
