"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvCert = void 0;
const getEnvCert = (envCert) => envCert === null || envCert === void 0 ? void 0 : envCert.replace(/\\n/g, '\n');
exports.getEnvCert = getEnvCert;
