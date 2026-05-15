"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Console = void 0;
const util_1 = __importDefault(require("util"));
const lodash_1 = require("lodash");
const MAX_LOGS_ROWS = 1000;
class Console {
    constructor(settings = {}) {
        this.logs = [];
        this.isScreenshoter = Boolean(settings.isScreenshoter);
    }
    log(...args) {
        if (this.isScreenshoter) {
            return;
        }
        if (this.logs.length >= MAX_LOGS_ROWS) {
            return;
        }
        const rowLogs = [];
        args.forEach((input) => {
            const linkSet = new Set();
            function customCloneAnalyze(value) {
                const complex = value !== null && typeof value === 'object';
                if (complex && linkSet.has(value)) {
                    return '[Circular]';
                }
                if (complex) {
                    linkSet.add(value);
                }
                if (value instanceof Set || value instanceof Map) {
                    return util_1.default.inspect(value);
                }
                if (typeof value === 'undefined') {
                    return '[undefined]';
                }
                return undefined;
            }
            rowLogs.push({
                type: typeof input,
                value: (0, lodash_1.cloneDeepWith)(input, customCloneAnalyze),
            });
        });
        this.logs.push(rowLogs);
    }
    getLogs() {
        if (this.logs.length >= MAX_LOGS_ROWS) {
            this.logs.push([
                {
                    type: 'string',
                    value: 'Too much logs',
                },
            ]);
        }
        try {
            JSON.stringify(this.logs);
            return this.logs;
        }
        catch (e) {
            return [
                [
                    {
                        type: 'string',
                        value: e.message,
                    },
                ],
            ];
        }
    }
}
exports.Console = Console;
