"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPV6_AXIOS_OPTIONS = void 0;
const axios_1 = require("../../shared/server/axios");
exports.IPV6_AXIOS_OPTIONS = (0, axios_1.getAgents)({ family: 6 });
