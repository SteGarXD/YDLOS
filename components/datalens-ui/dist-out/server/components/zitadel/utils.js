"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserInfo = exports.saveUserToLocals = exports.saveUserToSession = exports.generateServiceAccessUserToken = exports.fetchServiceUserAccessToken = exports.refreshTokens = exports.introspect = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const node_cache_1 = __importDefault(require("node-cache"));
const utils_1 = require("../charts-engine/components/utils");
const cache = new node_cache_1.default();
const axiosInstance = axios_1.default.create();
(0, axios_retry_1.default)(axiosInstance, { retries: 3 });
const introspect = async (ctx, token) => {
    ctx.log('Token introspection');
    if (!ctx.config.zitadelInternalUri) {
        throw new Error('Missing ZITADEL_INTERNAL_URI in env');
    }
    if (!ctx.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    if (!ctx.config.clientSecret) {
        throw new Error('Missing CLIENT_SECRET in env');
    }
    try {
        if (!token) {
            throw new Error('Token not provided');
        }
        const hrStart = process.hrtime();
        const response = await axiosInstance({
            method: 'post',
            url: `${ctx.config.zitadelInternalUri}/oauth/v2/introspect`,
            auth: {
                username: ctx.config.clientId,
                password: ctx.config.clientSecret,
            },
            params: {
                token,
            },
        });
        const { active, preferred_username, name, sub, email } = response.data;
        const result = {
            active: Boolean(active),
            login: preferred_username,
            userId: sub,
            displayName: name,
            email,
        };
        ctx.log(`Token introspected successfully within: ${(0, utils_1.getDuration)(hrStart)} ms`);
        return result;
    }
    catch (e) {
        ctx.logError('Failed to introspect token', e);
        return { active: false };
    }
};
exports.introspect = introspect;
const refreshTokens = async (ctx, refreshToken) => {
    ctx.log('Refreshing tokens');
    if (!ctx.config.zitadelInternalUri) {
        throw new Error('Missing ZITADEL_INTERNAL_URI in env');
    }
    if (!ctx.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    if (!ctx.config.clientSecret) {
        throw new Error('Missing CLIENT_SECRET in env');
    }
    if (!refreshToken) {
        throw new Error('Token not provided');
    }
    try {
        const response = await axiosInstance({
            method: 'post',
            url: `${ctx.config.zitadelInternalUri}/oauth/v2/token`,
            auth: {
                username: ctx.config.clientId,
                password: ctx.config.clientSecret,
            },
            params: {
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                scope: 'openid profile',
            },
        });
        ctx.log('Tokens refreshed successfully');
        return { accessToken: response.data.access_token, refreshToken: response.data.refresh_token };
    }
    catch (e) {
        ctx.logError('Failed to refresh tokens', e);
        return { accessToken: undefined, refreshToken: undefined };
    }
};
exports.refreshTokens = refreshTokens;
const fetchServiceUserAccessToken = async (ctx) => {
    if (!ctx.config.zitadelInternalUri) {
        throw new Error('Missing ZITADEL_INTERNAL_URI in env');
    }
    if (!ctx.config.serviceClientId) {
        throw new Error('Missing SERVICE_CLIENT_ID in env');
    }
    if (!ctx.config.serviceClientSecret) {
        throw new Error('Missing SERVICE_CLIENT_SECRET in env');
    }
    if (!ctx.config.zitadelProjectId) {
        throw new Error('Missing ZITADEL_PROJECT_ID in env');
    }
    try {
        ctx.log('Fetching service user access token');
        const response = await axiosInstance({
            method: 'post',
            url: `${ctx.config.zitadelInternalUri}/oauth/v2/token`,
            auth: {
                username: ctx.config.serviceClientId,
                password: ctx.config.serviceClientSecret,
            },
            params: {
                grant_type: 'client_credentials',
                scope: `openid profile urn:zitadel:iam:org:project:id:${ctx.config.zitadelProjectId}:aud urn:zitadel:iam:org:project:id:zitadel:aud`,
            },
        });
        ctx.log('Service user access token fetched successfully');
        const { access_token, expires_in } = response.data;
        return { access_token, expires_in };
    }
    catch (e) {
        ctx.logError('Failed to fetch service user access token', e);
        return { access_token: undefined, expires_in: undefined };
    }
};
exports.fetchServiceUserAccessToken = fetchServiceUserAccessToken;
const generateServiceAccessUserToken = async (ctx, userId) => {
    let token = cache.get(userId);
    if (token) {
        ctx.log('Service user access token retrieved from cache');
    }
    else {
        const { access_token, expires_in } = await (0, exports.fetchServiceUserAccessToken)(ctx);
        if (access_token && expires_in) {
            const safeTtl = Math.floor(0.9 * expires_in);
            ctx.log('Service user access token created, saving to cache');
            cache.set(userId, access_token, safeTtl);
            token = access_token;
        }
    }
    return token;
};
exports.generateServiceAccessUserToken = generateServiceAccessUserToken;
const saveUserToSession = async (req) => {
    return new Promise((resolve, reject) => {
        const ctx = req.ctx;
        const user = req.user;
        req.logIn(user, (err) => {
            if (err) {
                ctx.logError('Failed to save tokens to session', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.saveUserToSession = saveUserToSession;
const saveUserToLocals = (res, introspectResult) => {
    res.locals = res.locals || {};
    res.locals.zitadel = res.locals.zitadel || {};
    res.locals.zitadel.login = introspectResult.login;
    res.locals.zitadel.userId = introspectResult.userId;
    res.locals.zitadel.displayName = introspectResult.displayName;
    res.locals.zitadel.email = introspectResult.email;
};
exports.saveUserToLocals = saveUserToLocals;
const getUserInfo = (_req, res) => {
    if (!res.locals.zitadel) {
        return {};
    }
    return {
        login: res.locals.zitadel.login,
        email: res.locals.zitadel.email,
        formattedLogin: res.locals.zitadel.login,
        displayName: res.locals.zitadel.displayName,
        uid: res.locals.zitadel.userId,
    };
};
exports.getUserInfo = getUserInfo;
