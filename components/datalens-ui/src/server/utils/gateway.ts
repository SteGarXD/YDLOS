import type {IncomingHttpHeaders} from 'http';

import type {Request, Response} from '@gravity-ui/expresskit';
import type {Headers as DebugHeaders, GatewayConfig, GatewayError} from '@gravity-ui/gateway';
import type {AppContext, NodeKit} from '@gravity-ui/nodekit';
import {AppError} from '@gravity-ui/nodekit';

import {AppInstallation} from '../../shared/constants/common';
import {US_MASTER_TOKEN_HEADER} from '../../shared/constants/header';
import {getAuthArgs, getAuthHeaders} from '../../shared/schema/gateway-utils';
import {IPV6_AXIOS_OPTIONS} from '../constants/axios';

export type GatewayApiErrorResponse<T = GatewayError> = {
    error: T;
    debugHeaders?: DebugHeaders;
};

export const isGatewayError = (error: any): error is GatewayApiErrorResponse => {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const err = error.error;
    return (
        Boolean(err) &&
        typeof err === 'object' &&
        'code' in err &&
        'message' in err &&
        'status' in err
    );
};

const UNKNOWN_TYPE = 'unknownType';
const UNKNOWN_ENV = 'unknownEnv';

export const getGatewayConfig = (
    nodekit: NodeKit,
    config?: Partial<GatewayConfig<AppContext, Request, Response>>,
): GatewayConfig<AppContext, Request, Response> => {
    const axiosConfig = nodekit.config.useIPV6 ? IPV6_AXIOS_OPTIONS : {};

    return {
        installation: nodekit.config.appInstallation || UNKNOWN_TYPE,
        env: nodekit.config.appEnv || UNKNOWN_ENV,
        proxyHeaders: (headers) => {
            const HEADERS_WITH_SENSITIVE_URLS = ['referer'];
            const preparedHeaders: IncomingHttpHeaders = {};

            const proxyHeaders = nodekit.config.gatewayProxyHeaders;

            const proxyHeadersLowerCase = proxyHeaders.map((header) => header.toLowerCase());
            const headersWithSensitiveUrlsLowerCase = HEADERS_WITH_SENSITIVE_URLS.map((header) =>
                header.toLowerCase(),
            );

            Object.keys(headers).forEach((key) => {
                const keyLowerCase = key.toLowerCase();

                if (proxyHeadersLowerCase.includes(keyLowerCase)) {
                    const value = headers[key];

                    if (
                        headersWithSensitiveUrlsLowerCase.includes(keyLowerCase) &&
                        typeof value === 'string'
                    ) {
                        preparedHeaders[key] = nodekit.utils.redactSensitiveQueryParams(value);
                    } else {
                        preparedHeaders[key] = value;
                    }
                }
            });

            /**
             * Прокси gateway копирует только headers из gatewayProxyHeaders.
             * x-us-master-token до data-api обязателен для US (иначе ERR.DS_API.US / 500 на preview).
             * Условия шире, чем только APP_INSTALLATION: мерж opensource/common даёт usMasterToken;
             * в dev подставляем и при «пустом» .env (cwd не корень пакета).
             */
            const cfg = nodekit.config as {usMasterToken?: string; appInstallation?: string};
            const masterToken =
                cfg.usMasterToken || process.env.US_MASTER_TOKEN || 'us-master-token';
            const installationType = process.env.APP_INSTALLATION ?? cfg.appInstallation;
            const isOpensource = installationType === AppInstallation.Opensource;
            const isDev =
                nodekit.config.appEnv === 'development' || process.env.APP_ENV === 'development';

            if (
                isOpensource ||
                Boolean(cfg.usMasterToken) ||
                Boolean(process.env.US_MASTER_TOKEN) ||
                isDev
            ) {
                preparedHeaders[US_MASTER_TOKEN_HEADER] = masterToken;
            }

            return preparedHeaders;
        },
        caCertificatePath: null,
        axiosConfig,
        withDebugHeaders: false,
        getAuthArgs,
        getAuthHeaders,
        ErrorConstructor: AppError,
        ...(config || {}),
    };
};
