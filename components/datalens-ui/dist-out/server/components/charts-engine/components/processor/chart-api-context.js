"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChartApiContext = void 0;
const ui_sandbox_1 = require("../../../../../shared/constants/ui-sandbox");
const ui_sandbox_2 = require("../../../../../shared/utils/ui-sandbox");
const utils_1 = require("../utils");
const paramsUtils_1 = require("./paramsUtils");
const utils_2 = require("./utils");
function getOrphanedObject() {
    return Object.create(null);
}
const getChartApiContext = (args) => {
    const { name, params, actionParams, widgetConfig, data, dataStats, shared = {}, hooks, userLang, } = args;
    const api = {
        getSharedData: () => shared,
        getLang: () => userLang,
        ...hooks === null || hooks === void 0 ? void 0 : hooks.getSandboxApiMethods(),
    };
    api.resolveRelative = utils_1.resolveRelativeDate;
    api.resolveInterval = utils_1.resolveIntervalDate;
    api.resolveOperation = utils_1.resolveOperation;
    const context = {
        ChartEditor: api,
        __runtimeMetadata: getOrphanedObject(),
    };
    context.__runtimeMetadata.userConfigOverride = getOrphanedObject();
    context.__runtimeMetadata.libraryConfigOverride = getOrphanedObject();
    context.__runtimeMetadata.extra = getOrphanedObject();
    context.__runtimeMetadata.dataSourcesInfos = getOrphanedObject();
    api.setError = (value) => {
        context.__runtimeMetadata.error = value;
    };
    api.setChartsInsights = (value) => {
        context.__runtimeMetadata.chartsInsights = value;
    };
    /** We need for backward compatibility with ≤0.19.2 */
    api._setError = api.setError;
    api.getWidgetConfig = () => widgetConfig || {};
    api.getActionParams = () => actionParams || {};
    api.wrapFn = (value) => {
        if (!(0, utils_2.isWrapFnArgsValid)(value)) {
            // There is no way to reach this code, just satisfy ts
            throw new Error('You should pass a valid arguments to Editor.wrapFn method');
        }
        const fnArgs = Array.isArray(value.args)
            ? value.args.map((arg) => typeof arg === 'function' ? arg.toString() : arg)
            : value.args;
        return {
            [ui_sandbox_1.WRAPPED_FN_KEY]: {
                fn: value.fn.toString(),
                args: fnArgs,
                libs: value.libs,
            },
        };
    };
    api.generateHtml = ui_sandbox_2.wrapHtml;
    if (params) {
        api.getParams = () => params;
        api.getParam = (paramName) => (0, paramsUtils_1.getParam)(paramName, params);
    }
    if (name === 'Sources') {
        api.getSortParams = () => (0, paramsUtils_1.getSortParams)(params);
    }
    if (name === 'Sources' || name === 'Prepare') {
        api.getCurrentPage = () => (0, paramsUtils_1.getCurrentPage)(params);
    }
    if (name === 'Params' || name === 'Prepare' || name === 'Controls' || name === 'Sources') {
        api.updateParams = (updatedParams) => {
            context.__runtimeMetadata.userParamsOverride = Object.assign({}, context.__runtimeMetadata.userParamsOverride, updatedParams);
        };
        api.updateActionParams = (updatedActionParams) => {
            context.__runtimeMetadata.userActionParamsOverride = Object.assign({}, context.__runtimeMetadata.userActionParamsOverride, updatedActionParams);
        };
    }
    if (name === 'Controls' || name === 'Prepare') {
        api.getLoadedData = () => data || {};
        api.getLoadedDataStats = () => dataStats || {};
        api.setDataSourceInfo = (dataSourceKey, info) => {
            context.__runtimeMetadata.dataSourcesInfos[dataSourceKey] = { info };
        };
        if (name === 'Prepare') {
            api.updateConfig = (updatedFragment) => {
                context.__runtimeMetadata.userConfigOverride = Object.assign({}, context.__runtimeMetadata.userConfigOverride, updatedFragment);
            };
            api.updateHighchartsConfig = (updatedFragment) => {
                context.__runtimeMetadata.libraryConfigOverride = Object.assign({}, context.__runtimeMetadata.libraryConfigOverride, updatedFragment);
            };
            api.updateLibraryConfig = api.updateHighchartsConfig;
            api.setSideHtml = (html) => {
                context.__runtimeMetadata.sideMarkdown = html;
            };
            api.setSideMarkdown = (markdown) => {
                context.__runtimeMetadata.sideMarkdown = markdown;
            };
            api.setExtra = (key, value) => {
                context.__runtimeMetadata.extra[key] = value;
            };
            api.setExportFilename = (filename) => {
                context.__runtimeMetadata.exportFilename = filename;
            };
        }
    }
    return context;
};
exports.getChartApiContext = getChartApiContext;
