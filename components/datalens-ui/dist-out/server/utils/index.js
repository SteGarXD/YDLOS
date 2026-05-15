"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const pick_1 = __importDefault(require("lodash/pick"));
const shared_1 = require("../../shared");
const app_env_1 = require("../app-env");
const constants_1 = require("../components/public-api/constants");
const public_api_1 = require("../constants/public-api");
const gateway_1 = require("./gateway");
class Utils {
    static getName(key = '') {
        return key.split('/').filter(Boolean).pop();
    }
    static pickServiceHeaders(headers, req) {
        const { folderId: folderIdHeader, subjectToken: subjectTokenHeader } = req.ctx.config.headersMap;
        let headersList = [
            shared_1.AuthHeader.Cookie,
            shared_1.AuthHeader.Authorization,
            folderIdHeader,
            shared_1.TENANT_ID_HEADER,
            shared_1.PROJECT_ID_HEADER,
            shared_1.RPC_AUTHORIZATION,
            subjectTokenHeader,
        ];
        if (app_env_1.isOpensourceInstallation) {
            headersList = [];
        }
        return (0, pick_1.default)(headers, headersList);
    }
    static pickZitadelHeaders(req) {
        var _a;
        return {
            authorization: 'Bearer ' + ((_a = req.user) === null || _a === void 0 ? void 0 : _a.accessToken),
            [shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER]: req.serviceUserAccessToken,
        };
    }
    static pickAuthHeaders(req) {
        var _a;
        return {
            [shared_1.AuthHeader.Authorization]: 'Bearer ' + ((_a = req.ctx.get('user')) === null || _a === void 0 ? void 0 : _a.accessToken),
        };
    }
    static pickSuperuserHeaders(headers) {
        return (0, pick_1.default)(headers, [shared_1.SuperuserHeader.XDlSudo, shared_1.SuperuserHeader.XDlAllowSuperuser]);
    }
    static pickDlContextHeaders(headers) {
        return (0, pick_1.default)(headers, shared_1.DL_CONTEXT_HEADER);
    }
    static pickForwardHeaders(headers) {
        return (0, pick_1.default)(headers, shared_1.FORWARDED_FOR_HEADER);
    }
    static pickRpcAuthorizationHeaders(headers) {
        return (0, pick_1.default)(headers, shared_1.RPC_AUTHORIZATION);
    }
    static pickHeaders(req) {
        return {
            ...Utils.pickServiceHeaders(req.headers, req),
            ...Utils.pickSuperuserHeaders(req.headers),
            ...Utils.pickDlContextHeaders(req.headers),
            ...Utils.pickForwardHeaders(req.headers),
            ...Utils.pickRpcAuthorizationHeaders(req.headers),
            ...(req.ctx.config.isZitadelEnabled ? { ...Utils.pickZitadelHeaders(req) } : {}),
            ...(req.ctx.config.isAuthEnabled ? { ...Utils.pickAuthHeaders(req) } : {}),
            [shared_1.REQUEST_ID_HEADER]: req.id,
            ...(req.ctx.config.isZitadelEnabled ? { ...Utils.pickZitadelHeaders(req) } : {})
        };
    }
    static pickRpcHeaders(req) {
        const headersMap = req.ctx.config.headersMap;
        const orgId = req.headers[public_api_1.PUBLIC_API_ORG_ID_HEADER];
        const tenantId = orgId && !Array.isArray(orgId) ? (0, shared_1.makeTenantIdFromOrgId)(orgId) : undefined;
        return {
            ...(0, pick_1.default)(req.headers, [shared_1.AuthHeader.Authorization, headersMap.subjectToken]),
            ...Utils.pickForwardHeaders(req.headers),
            [shared_1.TENANT_ID_HEADER]: tenantId,
        };
    }
    static pickPublicApiHeaders(req) {
        const headersMap = req.ctx.config.headersMap;
        const orgId = req.headers[public_api_1.PUBLIC_API_ORG_ID_HEADER];
        const tenantId = orgId && !Array.isArray(orgId) ? (0, shared_1.makeTenantIdFromOrgId)(orgId) : undefined;
        return {
            ...(0, pick_1.default)(req.headers, [
                shared_1.AuthHeader.Authorization,
                headersMap.subjectToken,
                constants_1.PUBLIC_API_VERSION_HEADER,
            ]),
            ...Utils.pickForwardHeaders(req.headers),
            [shared_1.TENANT_ID_HEADER]: tenantId,
            [shared_1.REQUEST_SOURCE_HEADER]: shared_1.RequestSourceHeaderValue.PublicApi,
        };
    }
    static pickUsMasterToken(req) {
        const token = req.headers[shared_1.US_MASTER_TOKEN_HEADER];
        if (typeof token !== 'string') {
            return null;
        }
        return token;
    }
    static getErrorMessage(error) {
        var _a;
        if (axios_1.default.isAxiosError(error)) {
            return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data.message) || error.message;
        }
        else if (error instanceof Error) {
            return error.message;
        }
        else if ((0, gateway_1.isGatewayError)(error)) {
            return error.error.message;
        }
        else {
            return 'Unknown error';
        }
    }
    static getErrorDetails(error) {
        var _a;
        if (axios_1.default.isAxiosError(error)) {
            return (_a = error.response) === null || _a === void 0 ? void 0 : _a.data.details;
        }
        return undefined;
    }
    static getErrorCode(error) {
        var _a;
        if (axios_1.default.isAxiosError(error)) {
            return (_a = error.response) === null || _a === void 0 ? void 0 : _a.data.code;
        }
        else if ((0, gateway_1.isGatewayError)(error)) {
            return error.error.code;
        }
        return undefined;
    }
    static getErrorStatus(error) {
        var _a;
        if (axios_1.default.isAxiosError(error)) {
            return (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
        }
        return undefined;
    }
    static getFormattedLogin(login) {
        let formattedLogin = login;
        if (typeof formattedLogin === 'string' && !formattedLogin.includes('@')) {
            formattedLogin = formattedLogin.replace(/\./g, '-');
        }
        return formattedLogin;
    }
    static isDevelopment(ctx) {
        return ctx.config.appEnv === 'development';
    }
    static getResponseData(response) {
        return response.data;
    }
    static getEnvVariable(envVariableName) {
        const valueFromEnv = process.env[envVariableName];
        if (valueFromEnv) {
            return valueFromEnv;
        }
        const FILE_PATH_POSTFIX = '_FILE_PATH';
        const filePath = process.env[`${envVariableName}${FILE_PATH_POSTFIX}`];
        if (filePath) {
            return fs_1.default.readFileSync(filePath, 'utf8');
        }
        return undefined;
    }
}
exports.default = Utils;
