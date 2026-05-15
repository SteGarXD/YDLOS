"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_1 = require("../../../../../shared/components/auth/constants/cookie");
const constants_1 = require("./constants");
const apiAuth = async (req, res, next) => {
    req.ctx.log('API_AUTH');
    const authCookie = req.cookies[cookie_1.AUTH_COOKIE_NAME];
    if (!authCookie) {
        req.ctx.logError('API_AUTH_NO_COOKIE');
        res.status(401).send('Unauthorized access');
        return;
    }
    try {
        req.ctx.log('CHECK_ACCESS_TOKEN');
        const { accessToken } = JSON.parse(authCookie);
        const { userId, sessionId, roles } = jsonwebtoken_1.default.verify(accessToken, req.ctx.config.authTokenPublicKey || '', {
            algorithms: constants_1.ALGORITHMS,
        });
        req.originalContext.set('userId', userId);
        req.originalContext.set('user', {
            userId,
            sessionId,
            accessToken,
            roles,
        });
        req.ctx.log('CHECK_ACCESS_TOKEN_SUCCESS');
        next();
        return;
    }
    catch (err) {
        req.ctx.logError('CHECK_ACCESS_TOKEN_ERROR', err);
        res.status(401).send('Unauthorized access');
        return;
    }
};
exports.apiAuth = apiAuth;
