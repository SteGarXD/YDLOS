"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uiAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const request_ip_1 = __importDefault(require("request-ip"));
const set_cookie_parser_1 = __importDefault(require("set-cookie-parser"));
const shared_1 = require("../../../../../shared");
const cookie_1 = require("../../../../../shared/components/auth/constants/cookie");
const token_1 = require("../../../../../shared/components/auth/constants/token");
const url_1 = require("../../../../../shared/components/auth/constants/url");
const header_1 = require("../../../../../shared/constants/header");
const callbacks_1 = require("../../../../callbacks");
const registry_1 = require("../../../../registry");
const utils_1 = __importDefault(require("../../../../utils"));
const gateway_1 = require("../../../../utils/gateway");
const callbacks_2 = require("../../callbacks");
const constants_1 = require("./constants");
const uiAuth = async (req, res, next) => {
    var _a, _b, _c;
    req.ctx.log('UI_AUTH');
    let authCookie = req.cookies[cookie_1.AUTH_COOKIE_NAME];
    let authExpCookie = req.cookies[cookie_1.AUTH_EXP_COOKIE_NAME];
    if (!authCookie || !authExpCookie) {
        req.ctx.log('SIGNIN');
        (0, callbacks_2.onAuthSignin)(req, res);
        return;
    }
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const now = Math.floor(new Date().getTime() / 1000);
    const exp = Number(authExpCookie);
    if (now + token_1.ACCESS_TOKEN_TIME_RESERVE > exp) {
        req.ctx.log('START_REFRESH_TOKEN', {
            now,
            exp,
        });
        try {
            await gatewayApi.auth.auth
                .refreshTokens({
                ctx: req.ctx,
                headers: {
                    [header_1.AuthHeader.Cookie]: req.headers.cookie,
                    [header_1.FORWARDED_FOR_HEADER]: (_a = request_ip_1.default.getClientIp(req)) !== null && _a !== void 0 ? _a : undefined,
                },
                authArgs: {},
                requestId: (_b = req.ctx.get('requestId')) !== null && _b !== void 0 ? _b : '',
                args: undefined,
            })
                .then((result) => {
                const { responseHeaders } = result;
                if (responseHeaders) {
                    Object.keys(responseHeaders).forEach((header) => {
                        if (header.toLowerCase() === header_1.SET_COOKIE_HEADER.toLowerCase()) {
                            res.header(header, responseHeaders[header]);
                            const settedCookies = set_cookie_parser_1.default.parse(responseHeaders[header]);
                            settedCookies.forEach((cookie) => {
                                if (cookie.name === cookie_1.AUTH_COOKIE_NAME) {
                                    authCookie = cookie.value;
                                }
                                else if (cookie.name === cookie_1.AUTH_EXP_COOKIE_NAME) {
                                    authExpCookie = cookie.value;
                                }
                            });
                        }
                    });
                }
                req.ctx.log('FINISH_REFRESH_TOKEN', {
                    newExp: Number(authExpCookie),
                });
            });
        }
        catch (err) {
            req.ctx.logError('REFRESH_TOKEN_ERROR', (0, gateway_1.isGatewayError)(err) ? err.error : err);
            if (req.query[url_1.RELOADED_URL_QUERY]) {
                (0, callbacks_2.onAuthLogout)(req, res);
            }
            else {
                (0, callbacks_2.onAuthReload)(req, res);
            }
            return;
        }
    }
    let accessToken, userId, sessionId, roles;
    try {
        req.ctx.log('VERIFY_ACCESS_TOKEN');
        ({ accessToken } = JSON.parse(authCookie));
        ({ userId, sessionId, roles } = jsonwebtoken_1.default.verify(accessToken, req.ctx.config.authTokenPublicKey || '', {
            algorithms: constants_1.ALGORITHMS,
        }));
    }
    catch (err) {
        req.ctx.logError('VERIFY_ACCESS_TOKEN_ERROR', err);
        (0, callbacks_2.onAuthLogout)(req, res);
        return;
    }
    try {
        req.ctx.log('SET_USER_CTX');
        const { responseData: { profile }, } = await gatewayApi.root.auth.getMyUserProfile({
            ctx: req.ctx,
            headers: {
                [header_1.AuthHeader.Authorization]: 'Bearer ' + accessToken,
            },
            requestId: req.id,
            authArgs: {},
            args: undefined,
        });
        req.originalContext.set('userId', userId);
        req.originalContext.set('user', {
            userId,
            sessionId,
            accessToken,
            roles,
            profile: {
                login: profile.login,
                email: (_c = profile.email) !== null && _c !== void 0 ? _c : undefined,
                formattedLogin: profile.login,
                displayName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
                    profile.login ||
                    profile.email ||
                    userId,
                idpType: profile.idpType,
            },
        });
    }
    catch (err) {
        const errorCode = utils_1.default.getErrorCode(err);
        if (errorCode === shared_1.ErrorCode.AuthUserNotExists) {
            (0, callbacks_2.onAuthLogout)(req, res);
            return;
        }
        req.ctx.logError('SET_USER_CTX_ERROR', (0, gateway_1.isGatewayError)(err) ? err.error : err);
        (0, callbacks_1.onFail)(req, res);
        return;
    }
    next();
};
exports.uiAuth = uiAuth;
