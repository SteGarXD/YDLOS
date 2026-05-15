"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrRequests = scrRequests;
const shared_1 = require("../../shared");
function scrRequests() {
    return function scrRequestsMiddleware(req, res, next) {
        var _a;
        if ((_a = req.headers['user-agent']) === null || _a === void 0 ? void 0 : _a.includes(shared_1.SCR_USER_AGENT_HEADER_VALUE)) {
            res.locals.isRobot = true;
        }
        next();
    };
}
