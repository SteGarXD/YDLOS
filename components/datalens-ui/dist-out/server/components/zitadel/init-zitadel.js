"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initZitadel = initZitadel;
const cookie_session_1 = __importDefault(require("cookie-session"));
const passport_1 = __importDefault(require("passport"));
const passport_openidconnect_1 = __importDefault(require("passport-openidconnect"));
function initZitadel({ nodekit, beforeAuth, }) {
    if (!nodekit.config.zitadelUri) {
        throw new Error('Missing ZITADEL_URI in env');
    }
    if (!nodekit.config.zitadelInternalUri) {
        throw new Error('Missing ZITADEL_INTERNAL_URI in env');
    }
    if (!nodekit.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    if (!nodekit.config.clientSecret) {
        throw new Error('Missing CLIENT_SECRET in env');
    }
    if (!nodekit.config.appHostUri) {
        throw new Error('Missing APP_HOST_URI in env');
    }
    if (!nodekit.config.zitadelCookieSecret) {
        throw new Error('Missing ZITADEL_COOKIE_SECRET in env');
    }
    passport_1.default.use(new passport_openidconnect_1.default({
        issuer: nodekit.config.zitadelInternalUri,
        authorizationURL: `${nodekit.config.zitadelUri}/oauth/v2/authorize`,
        tokenURL: `${nodekit.config.zitadelInternalUri}/oauth/v2/token`,
        userInfoURL: `${nodekit.config.zitadelInternalUri}/oidc/v1/userinfo`,
        clientID: nodekit.config.clientId,
        clientSecret: nodekit.config.clientSecret,
        callbackURL: `${nodekit.config.appHostUri}/api/auth/callback`,
        scope: [
            'openid',
            'profile',
            'email',
            'offline_access',
            'urn:zitadel:iam:org:project:id:zitadel:aud',
        ],
        prompt: '1',
    }, (_issuer, uiProfile, _idProfile, _context, _idToken, accessToken, refreshToken, _params, done) => {
        if (typeof accessToken !== 'string') {
            throw new Error('Incorrect type of accessToken');
        }
        const { id, username } = uiProfile;
        return done(null, { accessToken, refreshToken, userId: id, username });
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user);
    });
    passport_1.default.deserializeUser(function (user, done) {
        done(null, user);
    });
    beforeAuth.push((0, cookie_session_1.default)({
        name: 'zitadelCookie',
        secret: nodekit.config.zitadelCookieSecret,
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 * 365, // 1 year
    }));
    beforeAuth.push(passport_1.default.initialize());
    beforeAuth.push(passport_1.default.session());
}
