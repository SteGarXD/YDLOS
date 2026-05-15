"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTelemetryCallbacks = void 0;
const get_1 = __importDefault(require("lodash/get"));
const object_sizeof_1 = __importDefault(require("object-sizeof"));
const getTime = () => new Date().toISOString().replace('T', ' ').split('.')[0];
const getTelemetryCallbacks = (ctx) => ({
    onConfigFetched: ({ id, statusCode, requestId, latency = 0, traceId, tenantId, userId }) => {
        ctx.stats('apiRequests', {
            requestId: requestId,
            service: 'us',
            action: 'fetchConfig',
            responseStatus: statusCode || 200,
            requestTime: latency,
            requestMethod: 'POST',
            requestUrl: id || '',
            traceId: traceId || '',
            tenantId: tenantId || '',
            userId: userId || '',
        });
    },
    onConfigFetchingFailed: (_error, { id, statusCode, requestId, latency = 0, traceId, tenantId, userId }) => {
        ctx.stats('apiRequests', {
            requestId: requestId,
            service: 'us',
            action: 'fetchConfig',
            responseStatus: statusCode || 500,
            requestTime: latency,
            requestMethod: 'POST',
            requestUrl: id || '',
            traceId: traceId || '',
            tenantId: tenantId || '',
            userId: userId || '',
        });
    },
    onDataFetched: ({ sourceName, url, requestId, statusCode, latency, traceId, tenantId, userId, }) => {
        ctx.stats('apiRequests', {
            requestId,
            service: sourceName || 'unknown-charts-source',
            action: 'fetchData',
            responseStatus: statusCode || 200,
            requestTime: latency,
            requestMethod: 'POST',
            requestUrl: url || '',
            traceId: traceId || '',
            tenantId: tenantId || '',
            userId: userId || '',
        });
    },
    onDataFetchingFailed: (_error, { sourceName, url, requestId, statusCode, latency, traceId, tenantId, userId }) => {
        ctx.stats('apiRequests', {
            requestId,
            service: sourceName || 'unknown-charts-source',
            action: 'fetchData',
            responseStatus: statusCode || 500,
            requestTime: latency,
            requestMethod: 'POST',
            requestUrl: url || '',
            traceId: traceId || '',
            tenantId: tenantId || '',
            userId: userId || '',
        });
    },
    onCodeExecuted: ({ id, requestId, latency }) => {
        ctx.stats('executions', {
            datetime: getTime(),
            requestId,
            entryId: id,
            jsTabExecDuration: Math.ceil(latency),
        });
    },
    onTabsExecuted: ({ result, entryId }) => {
        const { sources, sourceData, processedData } = result;
        const chartEntryId = entryId || '';
        const datetime = Date.now();
        let rowsCount = 0;
        let columnsCount = 0;
        if (sourceData && typeof sourceData === 'object') {
            Object.values(sourceData).forEach((item) => {
                rowsCount += (0, get_1.default)(item, 'result_data[0].rows.length', 0);
                columnsCount = Math.max(columnsCount, (0, get_1.default)(item, 'result_data[0].rows[0].data.length', 0));
            }, 0);
        }
        ctx.stats('chartSizeStats', {
            datetime,
            entryId: chartEntryId,
            requestedDataSize: sources && typeof sources === 'object'
                ? Object.values(sources).reduce((sum, item) => sum + (0, get_1.default)(item, 'size', 0), 0)
                : 0,
            requestedDataRowsCount: rowsCount,
            requestedDataColumnsCount: columnsCount,
            processedDataSize: (0, object_sizeof_1.default)(processedData),
        });
    },
});
exports.getTelemetryCallbacks = getTelemetryCallbacks;
