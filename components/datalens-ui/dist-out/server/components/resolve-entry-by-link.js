"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
const querystring_1 = require("querystring");
const nodekit_1 = require("@gravity-ui/nodekit");
const registry_1 = require("../registry");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["IncorrectURL"] = "INCORRECT_URL";
    ErrorCode["NotFound"] = "NOT_FOUND";
    ErrorCode["Forbidden"] = "FORBIDDEN";
    ErrorCode["Unknown"] = "UNKNOWN";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// eslint-disable-next-line complexity
async function resolveEntryByLink({ originalUrl, ctx, getEntryMeta, }) {
    try {
        const url = new URL(originalUrl, 'http://stub');
        const idOrKeyOrReport = url.pathname
            .replace(/^\/navigation\//, '')
            .replace(/^\/navigate\//, '')
            .replace(/^\/wizard\/preview\//, '')
            .replace(/^(\/(ChartPreview|preview))?(\/(ChartWizard|wizard|ChartEditor|editor))?\/?/, '') || url.searchParams.get('name');
        if (!idOrKeyOrReport) {
            throw new nodekit_1.AppError("Url doesn't contain a valid entry identificator", {
                code: ErrorCode.IncorrectURL,
            });
        }
        const params = (0, querystring_1.parse)(url.searchParams.toString());
        let entry;
        const { extractEntryId } = registry_1.registry.common.functions.getAll();
        const possibleEntryId = extractEntryId(idOrKeyOrReport);
        if (possibleEntryId) {
            entry = await getEntryMeta({ entryId: possibleEntryId });
        }
        else {
            throw new nodekit_1.AppError('Incorrect entry identificator', {
                code: ErrorCode.IncorrectURL,
            });
        }
        ctx.log('RESOLVE_ENTRY_BY_LINK_SUCCESS', { originalUrl, entryId: entry.entryId, params });
        return {
            entry,
            params,
        };
    }
    catch (error) {
        ctx.logError('RESOLVE_ENTRY_BY_LINK_FAILED', error, { originalUrl });
        if (typeof error === 'object' && error !== null) {
            if (error instanceof nodekit_1.AppError || ('error' in error && Boolean(error.error))) {
                throw error;
            }
            else if ('response' in error && error.response) {
                const response = error.response;
                if (typeof response === 'object' && response !== null && 'status' in response) {
                    if (response.status === 403) {
                        throw nodekit_1.AppError.wrap(error, {
                            code: ErrorCode.Forbidden,
                        });
                    }
                    if (response.status === 404) {
                        throw nodekit_1.AppError.wrap(error, {
                            code: ErrorCode.NotFound,
                        });
                    }
                }
            }
        }
        throw nodekit_1.AppError.wrap(error, { code: ErrorCode.Unknown });
    }
}
exports.default = resolveEntryByLink;
