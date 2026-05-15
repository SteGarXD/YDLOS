"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFunctionTemplate = void 0;
const makeFunctionTemplate = (options) => {
    return ((options === null || options === void 0 ? void 0 : options.isReduxThunkActionTemplate) ? () => () => { } : () => { });
};
exports.makeFunctionTemplate = makeFunctionTemplate;
