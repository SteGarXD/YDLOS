"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTypedQueryParameters = void 0;
const processTypedQueryParameters = (args) => {
    const { parameters, ChartEditor } = args;
    const params = Object.keys(parameters).reduce((acc, key) => Object.assign(acc, { [key]: '' }), {});
    ChartEditor.updateParams(params);
};
exports.processTypedQueryParameters = processTypedQueryParameters;
