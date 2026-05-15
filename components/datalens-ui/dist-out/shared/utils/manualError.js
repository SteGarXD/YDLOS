"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualError = void 0;
exports.isManualError = isManualError;
class ManualError extends Error {
    constructor({ message, originalError, code, status, details, debug, extra }) {
        super(message);
        this._manualError = true;
        this.code = code;
        this.status = status;
        this.details = details;
        this.debug = debug;
        this.extra = extra;
        if (originalError) {
            this.name = originalError.name;
            this.stack = originalError.stack;
        }
    }
}
exports.ManualError = ManualError;
function isManualError(error) {
    return Boolean(error._manualError);
}
