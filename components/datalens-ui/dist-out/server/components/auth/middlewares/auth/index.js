"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appAuth = appAuth;
const api_auth_1 = require("./api-auth");
const ui_auth_1 = require("./ui-auth");
async function appAuth(req, res, next) {
    if (req.routeInfo.ui) {
        (0, ui_auth_1.uiAuth)(req, res, next);
    }
    else {
        (0, api_auth_1.apiAuth)(req, res, next);
    }
}
