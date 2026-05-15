/**
 * @file routes/datalens-auth.js
 * Роуты, совместимые с контрактом DataLens UI: /signin, /refresh, /logout.
 * UI ожидает куки auth и auth_exp, проксирует их при refresh.
 */

var express = require('express');
var router = express.Router();
var authorizeDb = require('../modules/authorize/authorization-db');
var args = require('../modules/conf')();

const AUTH_COOKIE_NAME = 'auth';
const AUTH_EXP_COOKIE_NAME = 'auth_exp';
const COOKIE_MAX_AGE_SEC = 24 * 60 * 60; // 24 часа

function setAuthCookies(res, token, exp) {
    const opts = { httpOnly: true, path: '/', maxAge: COOKIE_MAX_AGE_SEC, sameSite: 'lax' };
    res.cookie(AUTH_COOKIE_NAME, token, opts);
    res.cookie(AUTH_EXP_COOKIE_NAME, String(exp), opts);
}

function clearAuthCookies(res) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    res.clearCookie(AUTH_EXP_COOKIE_NAME, { path: '/' });
}

/**
 * POST /signin — контракт UI: body { login, password }
 */
router.post('/signin', function (req, res) {
    var login = (req.body.login || req.body.UserName || '').trim();
    var password = req.body.password || req.body.Password || '';

    if (!login || !password) {
        return res.status(400).json({ error: 'login and password required' });
    }

    var ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    authorizeDb.getUser(login, password, ip, null, req.headers['user-agent'], args.auth_key_mode, true, true, function (user) {
        if (user.id === -1) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        var token = (args.auth_key_mode && user.b_key)
            ? Buffer.from(login + '::' + (user.n_key || '')).toString('base64')
            : Buffer.from(login + ':' + password).toString('base64');
        var exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC;
        setAuthCookies(res, token, exp);
        res.status(200).json({ success: true });
    });
});

/**
 * POST /refresh — контракт UI: Cookie с auth; в ответе Set-Cookie
 */
router.post('/refresh', function (req, res) {
    var cookieHeader = req.headers.cookie || '';
    var authCookie = null;
    cookieHeader.split(';').forEach(function (part) {
        var p = part.trim().split('=');
        if (p[0] === AUTH_COOKIE_NAME && p[1]) authCookie = p[1].trim();
    });

    if (!authCookie) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // UI (auth-gateway-handler) кладёт куку auth как JSON.stringify({ accessToken }) — токен тот же base64(login:pwd), что и у /demo/auth
    try {
        var decodedName = decodeURIComponent(authCookie);
        if (decodedName.charAt(0) === '{') {
            var parsed = JSON.parse(decodedName);
            if (parsed && typeof parsed.accessToken === 'string') {
                authCookie = parsed.accessToken;
            }
        }
    } catch (e) {
        /* оставляем сырое значение куки */
    }

    var userInfo;
    try {
        var decoded = Buffer.from(authCookie, 'base64').toString();
        userInfo = decoded.split(':');
        if (userInfo.length < 2) userInfo = decoded.split('::');
    } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    var login = userInfo[0];
    var passwordOrKey = userInfo[1] || '';
    var ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
    var key = userInfo.length >= 3 ? userInfo[2] : null;

    authorizeDb.getUser(login, passwordOrKey, ip, key, req.headers['user-agent'], args.auth_key_mode, false, false, function (user) {
        if (user.id === -1) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        var token = (args.auth_key_mode && user.b_key)
            ? Buffer.from(login + '::' + (user.n_key || '')).toString('base64')
            : Buffer.from(login + ':' + passwordOrKey).toString('base64');
        var exp = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE_SEC;
        // Как auth-gateway-handler в UI: кука auth — JSON с accessToken (дальше клиент / ui-auth парсят так же, как после signin)
        var opts = { httpOnly: true, path: '/', maxAge: COOKIE_MAX_AGE_SEC * 1000, sameSite: 'lax' };
        res.cookie(AUTH_COOKIE_NAME, JSON.stringify({ accessToken: token }), opts);
        res.cookie(AUTH_EXP_COOKIE_NAME, String(exp), opts);
        res.status(200).json({ success: true });
    });
});

/**
 * GET /logout — контракт UI: сброс куков
 */
router.get('/logout', function (req, res) {
    clearAuthCookies(res);
    res.status(200).json({ success: true });
});

module.exports = function () {
    return router;
};
