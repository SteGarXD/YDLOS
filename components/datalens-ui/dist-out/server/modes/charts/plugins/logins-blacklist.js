"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const types_1 = require("../../../components/charts-engine/types");
const { CHARTS_LOGIN_BLACKLIST } = process.env;
const blacklist = CHARTS_LOGIN_BLACKLIST ? new Set(CHARTS_LOGIN_BLACKLIST.split(',')) : null;
exports.plugin = {
    middlewares: [
        {
            stage: types_1.MiddlewareStage.AfterAuth,
            fn: (req, res, next) => {
                const { login } = req.blackbox || {};
                if (login && blacklist && blacklist.has(login)) {
                    res.status(429).send({
                        message: 'Your login is blacklisted',
                    });
                    return;
                }
                next();
            },
        },
    ],
};
