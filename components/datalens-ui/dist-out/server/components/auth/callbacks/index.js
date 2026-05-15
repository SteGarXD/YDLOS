"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAuthReload = onAuthReload;
exports.onAuthSignin = onAuthSignin;
exports.onAuthLogout = onAuthLogout;
const auth_layout_1 = require("./auth-layout");
async function onAuthReload(req, res) {
    res.status(409).send(await (0, auth_layout_1.getAuthLayout)(req, res, { page: 'reload' }));
}
async function onAuthSignin(req, res) {
    res.status(200).send(await (0, auth_layout_1.getAuthLayout)(req, res, { page: 'signin' }));
}
async function onAuthLogout(req, res) {
    res.status(401).send(await (0, auth_layout_1.getAuthLayout)(req, res, { page: 'logout' }));
}
