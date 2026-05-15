"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessorHooks = exports.HookError = void 0;
const lodash_1 = require("lodash");
class HookError extends Error {
    constructor() {
        super(...arguments);
        this.hookError = {};
    }
}
exports.HookError = HookError;
const isHookError = (err) => {
    return 'hookError' in err;
};
class ProcessorHooks {
    constructor({ processorHooks }) {
        this._processorHooks = processorHooks;
        this._hooks = [];
    }
    static get STATUS() {
        return {
            SUCCESS: 'success',
            FAILED: 'failed',
        };
    }
    getLogsFormatter() {
        const hooksFormatters = this._hooks
            .filter((hook) => typeof hook.logsFormatter === 'function')
            .map((hook) => hook.logsFormatter);
        return hooksFormatters.length > 0 && (0, lodash_1.flow)(hooksFormatters);
    }
    getSandboxApiMethods() {
        return this._hooks
            .filter((hook) => typeof hook.getSandboxApiMethods === 'function')
            .map((hook) => hook.getSandboxApiMethods())
            .reduce((acc, methods) => {
            return {
                ...acc,
                ...methods,
            };
        }, {});
    }
    async init({ config, isEditMode, ctx, hooksContext, }) {
        let hrStart;
        for (const processHook of this._processorHooks) {
            hrStart = process.hrtime();
            const hookName = processHook.name || 'UnknownHook';
            try {
                ctx.log(`Hook ${hookName} init`);
                const hook = processHook.init({
                    config,
                    isEditMode,
                    ctx,
                    hooksContext,
                });
                ctx.log(`Hook ${hookName} process`);
                await hook.process();
                this._hooks.push(hook);
            }
            catch (error) {
                ctx.logError(`Hook ${hookName} failed`);
                if (typeof error === 'object' && error !== null && isHookError(error)) {
                    return {
                        error,
                        hookError: error.hookError,
                        status: ProcessorHooks.STATUS.FAILED,
                    };
                }
                else {
                    return {
                        error,
                        hookError: { message: 'unknown hook error' },
                        status: ProcessorHooks.STATUS.FAILED,
                    };
                }
            }
            const text = `EditorEngine::${hookName}::HookResolved`;
            const hrEnd = process.hrtime(hrStart);
            ctx.log(`${text}: ${hrEnd[0]}s ${hrEnd[1] / 1000000}ms`);
        }
        return {
            status: ProcessorHooks.STATUS.SUCCESS,
        };
    }
}
exports.ProcessorHooks = ProcessorHooks;
