"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgents = void 0;
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const getAgents = ({ family }) => {
    return {
        httpAgent: new http_1.default.Agent({
            //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
            family,
        }),
        httpsAgent: new https_1.default.Agent({
            //@ts-ignore https://github.com/nodejs/node/blob/master/lib/_http_agent.js#L233
            family,
        }),
    };
};
exports.getAgents = getAgents;
