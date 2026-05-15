import type {NextFunction, Request, Response} from '@gravity-ui/expresskit';
import {REQUEST_ID_PARAM_NAME} from '@gravity-ui/nodekit';

import {onFail} from '../callbacks';
import {registry} from '../registry';
import type {DatalensGatewaySchemas} from '../types/gateway';

/** В dev при недоступности us (403/таймаут) не роняем страницу в 500 — продолжаем с дефолтной палитрой. */
const isDev = process.env.APP_ENV === 'development' || process.env.NODE_ENV === 'development';

export function getTenantSettingsMiddleware() {
    async function resolveTenantSettings(req: Request, res: Response, next: NextFunction) {
        const {ctx} = req;

        const requestId = req.ctx.get(REQUEST_ID_PARAM_NAME);
        const currentTenantId = 'common';

        const {gatewayApi} = registry.getGatewayApi<DatalensGatewaySchemas>();
        const {getAuthArgsUSPrivate} = registry.common.auth.getAll();
        const authArgsUSPrivate = getAuthArgsUSPrivate(req, res);

        try {
            const tenantDetailsResponce = await gatewayApi.usPrivate._getTenantDetails({
                ctx,
                headers: req.headers,
                requestId: requestId ?? '',
                authArgs: authArgsUSPrivate,
                args: {tenantId: currentTenantId},
            });
            const resolvedTenant = tenantDetailsResponce.responseData;
            res.locals.tenantDefaultColorPaletteId = resolvedTenant.settings?.defaultColorPaletteId;
        } catch (error) {
            req.ctx.logError('TENANT_RESOLVED_FAILED', error);
            res.locals.tenantDefaultColorPaletteId = undefined;
            if (isDev) {
                next();
                return;
            }
            onFail(req, res);
            return;
        }

        next();
    }

    return function resolveTenantSettingsMiddleware(
        req: Request,
        res: Response,
        next: NextFunction,
    ) {
        resolveTenantSettings(req, res, next).catch((error) => next(error));
    };
}
