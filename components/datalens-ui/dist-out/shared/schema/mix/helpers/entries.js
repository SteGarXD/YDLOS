"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEntriesForPublication = void 0;
exports.filterEntirsForCheck = filterEntirsForCheck;
exports.escapeStringForLike = escapeStringForLike;
exports.getEntryVisualizationType = getEntryVisualizationType;
exports.getEntryHierarchy = getEntryHierarchy;
exports.getEntryMetaStatusByError = getEntryMetaStatusByError;
const get_1 = __importDefault(require("lodash/get"));
const types_1 = require("../../../types");
function filterEntirsForCheck(entries) {
    const datasetIds = [];
    const connectionsIds = [];
    entries.forEach((entry) => {
        if (!('scope' in entry)) {
            throw new Error("Entry should have required field 'scope'");
        }
        if (entry.scope === types_1.EntryScope.Dataset) {
            datasetIds.push(entry.entryId);
        }
        else if (entry.scope === types_1.EntryScope.Connection) {
            connectionsIds.push(entry.entryId);
        }
    });
    return { datasetIds, connectionsIds };
}
function escapeStringForLike(str) {
    return str.replace(/[%_]/g, '\\$&');
}
function getEntryVisualizationType(entry) {
    var _a;
    try {
        const sharedData = (0, get_1.default)(entry, 'data.shared');
        const shared = typeof sharedData === 'string' ? JSON.parse(sharedData) : null;
        return (_a = shared === null || shared === void 0 ? void 0 : shared.visualization) === null || _a === void 0 ? void 0 : _a.id;
    }
    catch (e) {
        return undefined;
    }
}
function getEntryHierarchy(entry) {
    try {
        const sharedData = (0, get_1.default)(entry, 'data.shared');
        const shared = typeof sharedData === 'string' ? JSON.parse(sharedData) : null;
        return shared === null || shared === void 0 ? void 0 : shared.hierarchies;
    }
    catch (e) {
        return undefined;
    }
}
const checkEntriesForPublication = async ({ entries, typedApi, workbookId, }) => {
    const { datasetIds } = filterEntirsForCheck(entries);
    const promises = [null, null];
    if (datasetIds.length) {
        promises[0] = typedApi.bi.checkDatasetsForPublication({
            datasetsIds: datasetIds,
            workbookId,
        });
    }
    // if (connectionsIds.length) {
    //     promises[1] = typedApi.bi.checkConnectionsForPublication({
    //         connectionsIds: connectionsIds,
    //         workbookId,
    //     });
    // }
    return Promise.all(promises);
};
exports.checkEntriesForPublication = checkEntriesForPublication;
function getEntryMetaStatusByError(errorWrapper) {
    let error;
    if (errorWrapper instanceof Object && 'error' in errorWrapper) {
        error = errorWrapper.error;
    }
    if (typeof error === 'object' && error !== null && 'status' in error) {
        switch (error.status) {
            case 400:
                // us ajv validation
                if ('code' in error && error.code === 'DECODE_ID_FAILED') {
                    return { code: 'NOT_FOUND' };
                }
                // us zod validation
                if ('code' in error && error.code === 'VALIDATION_ERROR') {
                    const path = (0, get_1.default)(error, ['details', 'details', 0, 'path', 0]);
                    if (path === 'entryId') {
                        return { code: 'NOT_FOUND' };
                    }
                }
                return { code: 'UNHANDLED' };
            case 403:
                return { code: 'FORBIDDEN' };
            case 404:
                return { code: 'NOT_FOUND' };
            default:
                return { code: 'UNHANDLED' };
        }
    }
    else {
        return { code: 'UNHANDLED' };
    }
}
