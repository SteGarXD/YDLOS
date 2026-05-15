"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.USProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const shared_1 = require("../../../../../../shared");
const constants_1 = require("../../../../../../shared/constants");
const error_handler_1 = require("../../error-handler");
const utils_1 = require("../../utils");
const app_env_1 = require("../../../../../app-env");
const handleError = (0, error_handler_1.createErrorHandler)({
    meta: {
        tags: {
            component: 'storage',
        },
    },
});
(0, axios_retry_1.default)(axios_1.default, {
    retries: 2,
    retryDelay: (retryCount) => {
        return 50 * retryCount;
    },
});
const ENTRY_NOT_FOUND = 'ENTRY_NOT_FOUND';
const TEN_SECONDS = app_env_1.unitedStorageConfigLoadedTimeout;
const PASSED_PROPERTIES = [
    'entryId',
    'data',
    'key',
    'links',
    'meta',
    'permissions',
    'scope',
    'type',
    'public',
    'isFavorite',
    'revId',
    'savedId',
    'publishedId',
    'createdAt',
    'createdBy',
    'updatedAt',
    'updatedBy',
    'workbookId',
    'servicePlan',
    'tenantFeatures',
    'tenantSettings',
    'annotation',
];
const PASSED_HEADERS = [
    // Auth for domain
    shared_1.AuthHeader.Cookie,
    // Auth with OAuth token
    shared_1.AuthHeader.Authorization,
    // For correct Blackbox-auth on *.yandex.net
    'x-origin-host',
    shared_1.SuperuserHeader.XDlAllowSuperuser,
    shared_1.SuperuserHeader.XDlSudo,
    shared_1.DL_CONTEXT_HEADER,
    shared_1.US_PUBLIC_API_TOKEN_HEADER,
    shared_1.FORWARDED_FOR_HEADER,
    shared_1.TRACE_ID_HEADER,
    // Token for embedded charts
    shared_1.DL_EMBED_TOKEN_HEADER,
    shared_1.DL_COMPONENT_HEADER,
    shared_1.RPC_AUTHORIZATION
];
const DEFAULT_MAX_BODY_LENGTH = 15 * 1024 * 1024; // 100 MB
const DEFAULT_MAX_CONTENT_LENGTH = 15 * 1024 * 1024; // 100 MB
function formatPassedHeaders(headers, ctx, extraAllowedHeaders) {
    const headersNew = {};
    const { headersMap } = ctx.config;
    const passedHeaders = [
        ...PASSED_HEADERS,
        headersMap.folderId,
        headersMap.subjectToken,
        shared_1.PROJECT_ID_HEADER,
        shared_1.TENANT_ID_HEADER,
        shared_1.SERVICE_USER_ACCESS_TOKEN_HEADER,
        ...(extraAllowedHeaders || []),
    ];
    if (headers) {
        passedHeaders.forEach((name) => {
            if (headers[name]) {
                headersNew[name] = headers[name];
            }
        });
    }
    return headersNew;
}
function formatPassedProperties(entry = {}) {
    var _a;
    // These fallbacks are needed to work with some old entities migrated to the US from the conf repository
    const entryId = (entry.meta || {}).entryId || entry.entryId;
    const workbookId = entry.workbookId;
    const key = entry.key || (entry.meta || {}).key;
    const type = (entry.meta || {}).stype || entry.type;
    const publicAuthor = (_a = entry.unversionedData) === null || _a === void 0 ? void 0 : _a.publicAuthor;
    const formattedData = {};
    PASSED_PROPERTIES.forEach((field) => {
        formattedData[field] = entry[field];
    });
    // It's better not to remove this, a lot of things are tied to this meta format
    const meta = {
        ...entry.meta,
        stype: type,
        owner: entry.createdBy,
    };
    formattedData.entryId = entryId;
    formattedData.workbookId = workbookId;
    formattedData.key = key;
    formattedData.type = type;
    formattedData.meta = meta;
    // unversioned data
    if (publicAuthor) {
        formattedData.publicAuthor = publicAuthor;
    }
    return formattedData;
}
let storageEndpoint;
function injectMetadata(headers, ctx) {
    const metadata = ctx.getMetadata();
    return { ...headers, ...metadata };
}
class USProvider {
    static init({ endpoint, requestIdHeaderName }) {
        storageEndpoint = endpoint;
        PASSED_HEADERS.push(requestIdHeaderName);
    }
    static retrieveById(ctx, { id, revId, unreleased, includeLinks, includePermissionsInfo, includeServicePlan, includeTenantFeatures, headers, storageApiPath, extraAllowedHeaders, workbookId, }) {
        const hrStart = process.hrtime();
        const params = {
            branch: unreleased ? 'saved' : 'published',
            includeFavorite: true,
            includeTenantSettings: true,
        };
        if (includeServicePlan) {
            params.includeServicePlan = true;
        }
        if (includeTenantFeatures) {
            params.includeTenantFeatures = true;
        }
        if (includeLinks) {
            params.includeLinks = true;
        }
        if (includePermissionsInfo) {
            params.includePermissionsInfo = true;
        }
        if (revId) {
            params.revId = revId;
        }
        const formattedHeaders = formatPassedHeaders(headers, ctx, extraAllowedHeaders);
        if (workbookId) {
            formattedHeaders[shared_1.WORKBOOK_ID_HEADER] = workbookId;
        }
        const axiosArgs = {
            url: storageApiPath
                ? `${storageEndpoint}${storageApiPath}/${id}`
                : `${storageEndpoint}/v1/entries/${id}`,
            method: 'get',
            headers: injectMetadata(formattedHeaders, ctx),
            params,
            timeout: TEN_SECONDS,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_CONFIG_LOADED', { duration: (0, utils_1.getDuration)(hrStart) });
            return formatPassedProperties(response.data);
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.description = id;
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.description = id;
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_RETRIEVE_ERROR',
                    meta: { extra: { id } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static retrieveByKey(ctx, { key, unreleased, includeLinks, includePermissionsInfo, headers, }) {
        const hrStart = process.hrtime();
        const params = {
            key: key.replace(/^\//, ''),
            branch: unreleased ? 'saved' : 'published',
        };
        if (includeLinks) {
            params.includeLinks = true;
        }
        if (includePermissionsInfo) {
            params.includePermissionsInfo = true;
        }
        const formattedHeaders = formatPassedHeaders(headers, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/v1/entriesByKey`,
            method: 'get',
            headers: injectMetadata(formattedHeaders, ctx),
            params,
            timeout: TEN_SECONDS,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_CONFIG_LOADED', { duration: (0, utils_1.getDuration)(hrStart) });
            return formatPassedProperties(response.data);
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.description = key;
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.description = key;
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_RETRIEVE_ERROR',
                    meta: { extra: { key } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static retrieveByToken(ctx, { token, headers, includeServicePlan, includeTenantFeatures, }) {
        const hrStart = process.hrtime();
        const headersWithToken = {
            ...headers,
            [shared_1.DL_EMBED_TOKEN_HEADER]: token,
        };
        const params = { includeTenantSettings: true };
        if (includeServicePlan) {
            params.includeServicePlan = true;
        }
        if (includeTenantFeatures) {
            params.includeTenantFeatures = true;
        }
        const formattedHeaders = formatPassedHeaders(headersWithToken, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/v1/embedded-entry`,
            method: 'get',
            headers: injectMetadata(formattedHeaders, ctx),
            timeout: TEN_SECONDS,
            params,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_CONFIG_LOADED', { duration: (0, utils_1.getDuration)(hrStart) });
            return {
                token: response.data.token,
                embed: response.data.embed,
                entry: formatPassedProperties(response.data.entry),
            };
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.description = 'embedToken';
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.description = 'embedToken';
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_RETRIEVE_ERROR',
                    meta: { extra: { type: 'embedToken' } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static retrieveByTokenAndId(ctx, { id, token, headers, includeServicePlan, includeTenantFeatures, }) {
        const hrStart = process.hrtime();
        const headersWithToken = {
            ...headers,
            [shared_1.DL_EMBED_TOKEN_HEADER]: token,
        };
        const params = { includeTenantSettings: true };
        if (includeServicePlan) {
            params.includeServicePlan = true;
        }
        if (includeTenantFeatures) {
            params.includeTenantFeatures = true;
        }
        const formattedHeaders = formatPassedHeaders(headersWithToken, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/embeds/entries/${id}`,
            method: 'get',
            headers: injectMetadata(formattedHeaders, ctx),
            timeout: TEN_SECONDS,
            params
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_CONFIG_LOADED', { duration: (0, utils_1.getDuration)(hrStart) });
            return {
                token: response.data.embeddingInfo.token,
                embed: response.data.embeddingInfo.embed,
                entry: formatPassedProperties(response.data),
            };
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.description = 'embedToken and id';
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.description = 'embedToken and id';
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_RETRIEVE_ERROR',
                    meta: { extra: { type: 'embedToken and id' } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static create(ctx, { key, data, type, scope, links, headers, recursion = true, meta = {}, includePermissionsInfo, workbookId, name, mode = shared_1.EntryUpdateMode.Publish, annotation, }) {
        const hrStart = process.hrtime();
        const postedData = {
            key,
            data,
            scope,
            type,
            recursion,
            meta,
            workbookId,
            name,
            mode,
        };
        if (links) {
            postedData.links = links;
        }
        if (includePermissionsInfo) {
            postedData.includePermissionsInfo = true;
        }
        if (annotation) {
            postedData.annotation = annotation;
        }
        const formattedHeaders = formatPassedHeaders(headers, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/v1/entries`,
            method: 'post',
            headers: injectMetadata(formattedHeaders, ctx),
            data: postedData,
            timeout: TEN_SECONDS,
            maxBodyLength: DEFAULT_MAX_BODY_LENGTH,
            maxContentLength: DEFAULT_MAX_CONTENT_LENGTH,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_OBJECT_CREATED', { duration: (0, utils_1.getDuration)(hrStart) });
            return formatPassedProperties(response.data);
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_CREATE_ERROR',
                    meta: { extra: { key } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static update(ctx, { entryId, revId, data, type, mode = 'save', links, meta = {}, headers, skipSyncLinks, annotation, }) {
        const hrStart = process.hrtime();
        const postedData = {
            mode,
            meta,
        };
        if (revId) {
            postedData.revId = revId;
        }
        if (data) {
            postedData.data = data;
        }
        if (type) {
            postedData.type = type;
        }
        if (links) {
            postedData.links = links;
        }
        if (skipSyncLinks) {
            postedData.skipSyncLinks = true;
        }
        if (annotation) {
            postedData.annotation = annotation;
        }
        const formattedHeaders = formatPassedHeaders(headers, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/v1/entries/${entryId}`,
            method: 'post',
            headers: injectMetadata(formattedHeaders, ctx),
            data: postedData,
            timeout: TEN_SECONDS,
            maxBodyLength: DEFAULT_MAX_BODY_LENGTH,
            maxContentLength: DEFAULT_MAX_CONTENT_LENGTH,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_OBJECT_UPDATED', { duration: (0, utils_1.getDuration)(hrStart) });
            return formatPassedProperties(response.data);
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                throw handleError({
                    code: 'UNITED_STORAGE_OBJECT_UPDATE_ERROR',
                    meta: { extra: { entryId } },
                    error,
                    rethrow: false,
                });
            }
        });
    }
    static delete(ctx, { id, headers }) {
        const hrStart = process.hrtime();
        const formattedHeaders = formatPassedHeaders(headers, ctx);
        const axiosArgs = {
            url: `${storageEndpoint}/v1/entries/${id}`,
            method: 'delete',
            headers: injectMetadata(formattedHeaders, ctx),
            timeout: TEN_SECONDS,
        };
        return axios_1.default
            .request(axiosArgs)
            .then((response) => {
            ctx.log('UNITED_STORAGE_OBJECT_DELETED', { duration: (0, utils_1.getDuration)(hrStart) });
            return formatPassedProperties(response.data);
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
                error.code = ENTRY_NOT_FOUND;
                error.status = 404;
                throw error;
            }
            else if (error.response && error.response.status === 403) {
                error.code = constants_1.ErrorCode.EntryForbidden;
                error.status = 403;
                throw error;
            }
            else {
                handleError({
                    code: 'UNITED_STORAGE_OBJECT_UPDATE_ERROR',
                    meta: { extra: { id } },
                    error,
                });
            }
        });
    }
}
exports.USProvider = USProvider;
USProvider.errors = {
    ENTRY_NOT_FOUND,
};
