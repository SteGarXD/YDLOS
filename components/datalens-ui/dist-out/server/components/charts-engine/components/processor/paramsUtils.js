"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = exports.getCurrentPage = exports.getSortParams = void 0;
exports.updateParams = updateParams;
exports.updateActionParams = updateActionParams;
const getSortParams = (params) => {
    const columnId = Array.isArray(params._columnId) ? params._columnId[0] : params._columnId;
    const order = Array.isArray(params._sortOrder) ? params._sortOrder[0] : params._sortOrder;
    const _sortRowMeta = Array.isArray(params._sortRowMeta)
        ? params._sortRowMeta[0]
        : params._sortRowMeta;
    const _sortColumnMeta = Array.isArray(params._sortColumnMeta)
        ? params._sortColumnMeta[0]
        : params._sortColumnMeta;
    let meta;
    try {
        meta = {
            column: _sortColumnMeta ? JSON.parse(_sortColumnMeta) : {},
            row: _sortRowMeta ? JSON.parse(_sortRowMeta) : {},
        };
    }
    catch {
        meta = {};
    }
    return { columnId, order: Number(order), meta };
};
exports.getSortParams = getSortParams;
const getCurrentPage = (params) => {
    const page = Number(Array.isArray(params._page) ? params._page[0] : params._page);
    return isNaN(page) ? 1 : page;
};
exports.getCurrentPage = getCurrentPage;
const getParam = (paramName, params) => {
    return params[paramName] || [];
};
exports.getParam = getParam;
function updateParams({ userParamsOverride, params, usedParams, }) {
    if (userParamsOverride) {
        Object.keys(userParamsOverride).forEach((key) => {
            const overridenItem = userParamsOverride[key];
            if (params[key] && params[key].length > 0) {
                if (Array.isArray(overridenItem) && overridenItem.length > 0) {
                    params[key] = overridenItem;
                }
            }
            else {
                params[key] = overridenItem;
            }
            usedParams[key] = params[key];
        });
    }
}
function updateActionParams({ userActionParamsOverride, actionParams, }) {
    if (!userActionParamsOverride) {
        return actionParams;
    }
    return userActionParamsOverride;
    // todo after usedParams has fixed CHARTS-6619
    /*Object.keys(userActionParamsOverride).forEach((key) => {
        const overridenItem = userActionParamsOverride[key];

        if (params[key] && params[key].length > 0) {
            if (Array.isArray(overridenItem) && overridenItem.length > 0) {
                params[key] = overridenItem;
            }
        } else {
            params[key] = overridenItem;
        }

        usedParams[key] = params[key];
    });*/
}
