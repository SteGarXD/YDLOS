"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const utils_1 = require("../schema/utils");
const types_1 = require("../types");
const CHARTS_API_SCHEMA = {
    getWidget: (headers, endpoints, { entryId, unreleased, revId, }) => {
        const params = {
            includeLinks: '1',
            includePermissionsInfo: '1',
        };
        // previously, by default, if the unreleased parameter was not passed, true value was set
        // for the history of chart changes, change the default to return published version
        if (unreleased) {
            params.unreleased = '1';
        }
        if (revId) {
            params.revId = revId;
        }
        return {
            method: 'get',
            url: `${endpoints.charts}${constants_1.CHARTS_API_BASE_URL}/${(0, utils_1.filterUrlFragment)(entryId)}`,
            headers,
            params,
        };
    },
    createWidget: (headers, endpoints, { template = 'datalens', annotation, description = '', ...restArgs }) => {
        var _a;
        return ({
            method: 'post',
            url: `${endpoints.charts}${constants_1.CHARTS_API_BASE_URL}`,
            headers,
            data: {
                template,
                annotation: {
                    description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                },
                ...restArgs,
            },
        });
    },
    updateWidget: (headers, endpoints, { entryId, data, template = 'datalens', mode = types_1.EntryUpdateMode.Publish, annotation, description = '', }) => {
        var _a;
        return ({
            method: 'post',
            url: `${endpoints.charts}${constants_1.CHARTS_API_BASE_URL}/${(0, utils_1.filterUrlFragment)(entryId)}`,
            headers,
            data: {
                data,
                mode,
                template,
                annotation: {
                    description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                },
            },
        });
    },
    // DASH API
    createDash: (headers, endpoints, { data: { annotation, description, ...restArgs }, }) => {
        var _a;
        return ({
            method: 'post',
            url: `${endpoints.charts}${constants_1.DASH_API_BASE_URL}`,
            headers,
            data: {
                ...restArgs,
                annotation: {
                    description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                },
            },
        });
    },
    readDash: (headers, endpoints, { id, params, }) => ({
        method: 'get',
        url: `${endpoints.charts}${constants_1.DASH_API_BASE_URL}/${(0, utils_1.filterUrlFragment)(id)}`,
        headers,
        params,
    }),
    updateDash: (headers, endpoints, { id, data: { annotation, description, ...restArgs }, }) => {
        var _a;
        return ({
            method: 'post',
            url: `${endpoints.charts}${constants_1.DASH_API_BASE_URL}/${(0, utils_1.filterUrlFragment)(id)}`,
            headers,
            data: {
                ...restArgs,
                annotation: {
                    description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : description,
                },
            },
        });
    },
};
exports.default = CHARTS_API_SCHEMA;
