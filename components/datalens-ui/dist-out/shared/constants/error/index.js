"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
class ServerError extends Error {
    constructor(message, { status, code, details }) {
        super(message);
        this.name = 'ServerError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
exports.ServerError = ServerError;
