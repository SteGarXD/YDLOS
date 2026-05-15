"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
async function logout(req, res) {
    if (!req.ctx.config.clientId) {
        throw new Error('Missing CLIENT_ID in env');
    }
    req.logOut((err) => {
        if (err) {
            throw err;
        }
    });
    const url = `${req.ctx.config.zitadelUri}/oidc/v1/end_session?` +
        new URLSearchParams({
            post_logout_redirect_uri: req.ctx.config.appHostUri + '/auth',
            client_id: req.ctx.config.clientId,
        });
    res.redirect(url);
}
