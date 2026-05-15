"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workbooksTransferController = exports.prepareImportData = exports.prepareExportData = exports.proxyGetEntry = exports.sendResponse = exports.createImportResponseData = exports.createExportResponseData = void 0;
const nodekit_1 = require("@gravity-ui/nodekit");
const shared_1 = require("../../shared");
const workbook_transfer_1 = require("../../shared/constants/workbook-transfer");
const components_1 = require("../components");
const sdk_1 = require("../components/sdk");
const charts_1 = require("../components/workbook-transfer/charts");
const create_transfer_notifications_1 = require("../components/workbook-transfer/create-transfer-notifications");
const dash_1 = require("../components/workbook-transfer/dash");
const registry_1 = require("../registry");
const createExportResponseData = (notifications = [], entryData = null) => {
    return {
        notifications,
        entryData,
    };
};
exports.createExportResponseData = createExportResponseData;
const createImportResponseData = (notifications = [], id = null) => {
    return {
        id,
        notifications,
    };
};
exports.createImportResponseData = createImportResponseData;
const sendResponse = (res, data) => {
    res.status(200).send(data);
};
exports.sendResponse = sendResponse;
const getRequestId = (ctx) => ctx.get(nodekit_1.REQUEST_ID_PARAM_NAME) || '';
const proxyGetEntry = async (req, res, args) => {
    const { ctx } = req;
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const headers = {
        ...components_1.Utils.pickHeaders(req),
    };
    const requestId = getRequestId(ctx);
    const { getAuthArgsProxyUSPrivate } = registry_1.registry.common.auth.getAll();
    const authArgs = getAuthArgsProxyUSPrivate(req, res);
    try {
        return await gatewayApi.usPrivate._proxyGetEntry({
            headers,
            args: {
                ...args,
                branch: 'published',
            },
            authArgs,
            ctx,
            requestId,
        });
    }
    catch (ex) {
        const { error } = ex;
        // If failed to find published entry, at least take current saved
        if (error.status === 404) {
            return gatewayApi.usPrivate._proxyGetEntry({
                headers,
                args,
                authArgs,
                ctx,
                requestId,
            });
        }
        throw ex;
    }
};
exports.proxyGetEntry = proxyGetEntry;
const resolveScopeForEntryData = (entryData) => {
    return Object.values(shared_1.EntryScope).find((key) => key in entryData);
};
const prepareExportData = async (req, res) => {
    var _a, _b;
    const { ctx } = req;
    const headers = {
        ...components_1.Utils.pickHeaders(req),
    };
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const { exportId, scope, idMapping } = req.body;
    const workbookId = (_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.workbookId) !== null && _b !== void 0 ? _b : null;
    const { getAuthArgsProxyBIPrivate } = registry_1.registry.common.auth.getAll();
    switch (scope) {
        case shared_1.EntryScope.Dash: {
            const { responseData: entry } = await (0, exports.proxyGetEntry)(req, res, {
                entryId: exportId,
                workbookId,
            });
            if (entry.scope !== scope) {
                return (0, exports.createExportResponseData)([
                    (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData),
                ]);
            }
            const { dash, notifications } = await (0, dash_1.prepareDashExportData)(sdk_1.Dash.migrateDescription(entry), idMapping);
            return (0, exports.createExportResponseData)(notifications, {
                dash,
            });
        }
        case shared_1.EntryScope.Widget: {
            const { responseData: entry } = await (0, exports.proxyGetEntry)(req, res, {
                entryId: exportId,
                workbookId,
            });
            if (entry.scope !== scope) {
                return (0, exports.createExportResponseData)([
                    (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData),
                ]);
            }
            const { widget, notifications } = await (0, charts_1.prepareExportChartData)(entry, idMapping);
            return (0, exports.createExportResponseData)(notifications, { widget });
        }
        case shared_1.EntryScope.Connection: {
            const { responseData } = await gatewayApi.bi._proxyExportConnection({
                headers,
                args: {
                    connectionId: exportId,
                    workbookId,
                },
                authArgs: getAuthArgsProxyBIPrivate(req, res),
                ctx,
                requestId: getRequestId(ctx),
            });
            return (0, exports.createExportResponseData)(responseData.notifications, {
                connection: responseData.connection,
            });
        }
        case shared_1.EntryScope.Dataset: {
            const { responseData } = await gatewayApi.bi._proxyExportDataset({
                headers,
                args: {
                    datasetId: exportId,
                    idMapping,
                    workbookId,
                },
                authArgs: getAuthArgsProxyBIPrivate(req, res),
                ctx,
                requestId: getRequestId(ctx),
            });
            return (0, exports.createExportResponseData)(responseData.notifications, {
                dataset: responseData.dataset,
            });
        }
        default: {
            return (0, exports.createExportResponseData)([
                (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryScope),
            ]);
        }
    }
};
exports.prepareExportData = prepareExportData;
const prepareImportData = async (req, res) => {
    var _a;
    const { ctx } = req;
    const headers = {
        ...components_1.Utils.pickHeaders(req),
    };
    const { idMapping = {}, entryData = {}, workbookId } = req.body;
    const scope = resolveScopeForEntryData(entryData);
    const { gatewayApi } = registry_1.registry.getGatewayApi();
    const { getAuthArgsProxyBIPrivate, getAuthArgsProxyUSPrivate } = registry_1.registry.common.auth.getAll();
    switch (scope) {
        case shared_1.EntryScope.Connection: {
            const { responseData } = await gatewayApi.bi._proxyImportConnection({
                headers,
                args: {
                    workbookId,
                    connection: entryData.connection,
                },
                ctx,
                requestId: getRequestId(ctx),
                authArgs: getAuthArgsProxyBIPrivate(req, res),
            });
            return (0, exports.createImportResponseData)(responseData.notifications, responseData.id);
        }
        case shared_1.EntryScope.Dataset: {
            const { responseData } = await gatewayApi.bi._proxyImportDataset({
                headers,
                args: {
                    workbookId,
                    dataset: entryData.dataset,
                    idMapping,
                },
                ctx,
                requestId: getRequestId(ctx),
                authArgs: getAuthArgsProxyBIPrivate(req, res),
            });
            return (0, exports.createImportResponseData)(responseData.notifications, responseData.id);
        }
        case shared_1.EntryScope.Widget: {
            const { widget, notifications } = await (0, charts_1.prepareImportChartData)(entryData.widget, req, idMapping);
            if (!widget) {
                return (0, exports.createImportResponseData)(notifications);
            }
            const { responseData } = await gatewayApi.usPrivate._proxyCreateEntry({
                headers: {
                    ...headers,
                    metadata: ctx.getMetadata(),
                },
                args: {
                    workbookId,
                    data: widget.data,
                    key: widget.key,
                    name: widget.name,
                    type: widget.type,
                    scope: widget.scope,
                    mode: widget.mode,
                    links: widget.links,
                    annotation: widget.annotation,
                },
                ctx,
                authArgs: getAuthArgsProxyUSPrivate(req, res),
                requestId: getRequestId(ctx),
            });
            return (0, exports.createImportResponseData)(notifications, responseData.entryId);
        }
        case shared_1.EntryScope.Dash: {
            const { dash, notifications } = await (0, dash_1.prepareDashImportData)(entryData.dash, idMapping);
            if (!dash) {
                return (0, exports.createImportResponseData)(notifications);
            }
            const { data, annotation } = sdk_1.Dash.migrateDescription(dash);
            const { responseData } = await gatewayApi.usPrivate._proxyCreateEntry({
                headers,
                args: {
                    workbookId,
                    data: data,
                    key: dash.key,
                    name: dash.name,
                    type: dash.type,
                    scope: dash.scope,
                    mode: dash.mode,
                    links: dash.links,
                    annotation: {
                        description: (_a = annotation === null || annotation === void 0 ? void 0 : annotation.description) !== null && _a !== void 0 ? _a : '',
                    },
                },
                ctx,
                authArgs: getAuthArgsProxyUSPrivate(req, res),
                requestId: getRequestId(ctx),
            });
            return (0, exports.createImportResponseData)(notifications, responseData.entryId);
        }
        default: {
            return (0, exports.createImportResponseData)([
                (0, create_transfer_notifications_1.warningTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryScope),
            ]);
        }
    }
};
exports.prepareImportData = prepareImportData;
exports.workbooksTransferController = {
    capabilities: async (_, res) => {
        res.status(200).send(workbook_transfer_1.TransferCapabilities);
    },
    export: async (req, res) => {
        try {
            const { hasValidWorkbookTransferAuthHeaders } = registry_1.registry.common.auth.getAll();
            if (!(await hasValidWorkbookTransferAuthHeaders(req))) {
                res.status(403).send({
                    code: workbook_transfer_1.TransferErrorCode.TransferInvalidToken,
                });
                return;
            }
            (0, exports.sendResponse)(res, await (0, exports.prepareExportData)(req, res));
        }
        catch (ex) {
            const { error } = ex;
            res.status((error === null || error === void 0 ? void 0 : error.status) || 500).send(error);
        }
    },
    import: async (req, res) => {
        try {
            const { hasValidWorkbookTransferAuthHeaders } = registry_1.registry.common.auth.getAll();
            if (!(await hasValidWorkbookTransferAuthHeaders(req))) {
                res.status(403).send({
                    code: workbook_transfer_1.TransferErrorCode.TransferInvalidToken,
                });
                return;
            }
            (0, exports.sendResponse)(res, await (0, exports.prepareImportData)(req, res));
        }
        catch (ex) {
            const { error } = ex;
            res.status((error === null || error === void 0 ? void 0 : error.status) || 500).send(error);
        }
    },
};
