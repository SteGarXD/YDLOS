"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareExportChartData = exports.prepareImportChartData = void 0;
const forIn_1 = __importDefault(require("lodash/forIn"));
const isArray_1 = __importDefault(require("lodash/isArray"));
const shared_1 = require("../../../shared");
const workbook_transfer_1 = require("../../../shared/constants/workbook-transfer");
const types_1 = require("../../../shared/types");
const chart_generator_1 = require("../charts-engine/components/chart-generator");
const create_transfer_notifications_1 = require("./create-transfer-notifications");
const validateChartShared = (chartOptions) => {
    const requiredChartOptionsKeys = [
        'data',
        'name',
        'type',
    ];
    requiredChartOptionsKeys.forEach((key) => {
        if (!(key in chartOptions)) {
            throw new Error('Invalid chart options');
        }
    });
    if (typeof chartOptions.data.shared !== 'object') {
        throw new Error('Invalid chart chared object');
    }
};
const traverseDatasetFields = (obj, matchCallback) => {
    const { result_schema, sources } = obj || {};
    // Legacy dataset properties placeholder replacer
    if (result_schema && Array.isArray(result_schema)) {
        for (let i = 0; i <= result_schema.length; i++) {
            const item = result_schema[i];
            if (item === null || item === void 0 ? void 0 : item.datasetId) {
                item.datasetId = matchCallback(item.datasetId, item, 'datasetId');
            }
        }
    }
    // This is v1 field schema but saved and cause we are not migrating wizard charts
    // we need to migrate this fields before export\import
    if (sources && Array.isArray(sources)) {
        for (let i = 0; i <= sources.length; i++) {
            const item = sources[i];
            if (item === null || item === void 0 ? void 0 : item.connection_id) {
                item.connection_id = matchCallback(item.connection_id, item, 'connection_id');
            }
        }
    }
};
const traverseWizardFieldsRecursive = (obj, matchCallback) => {
    (0, forIn_1.default)(obj, (val, key) => {
        if (key === 'datasetId' && typeof val === 'string') {
            // Array<{datasetId: string}>
            obj[key] = matchCallback(val, obj, key);
        }
        else if (key === 'datasets' && Array.isArray(val)) {
            // datasets: [{id: string}]
            for (let i = 0; i <= val.length; i++) {
                const item = val[i];
                if (item === null || item === void 0 ? void 0 : item.id) {
                    item.id = matchCallback(item.id, item, 'id');
                }
                traverseDatasetFields(item, matchCallback);
            }
        }
        else if (key === 'dataset' && typeof val === 'object' && typeof val.id === 'string') {
            // dataset: {id: string}
            val.id = matchCallback(val.id, val, 'id');
            traverseDatasetFields(val, matchCallback);
        }
        else if (typeof val === 'object') {
            traverseWizardFieldsRecursive(val, matchCallback);
        }
    });
};
const traverseWizardFields = (obj, idMapping) => {
    const warnings = { missedMapping: false };
    const matchCallback = (val, obj, key) => {
        const mappedValue = idMapping[val];
        if (mappedValue) {
            obj[key] = mappedValue;
            return mappedValue;
        }
        warnings.missedMapping = true;
        return workbook_transfer_1.TRANSFER_UNKNOWN_ENTRY_ID;
    };
    // datasetsIds: string[]
    if ('datasetsIds' in obj && (0, isArray_1.default)(obj.datasetsIds)) {
        const { datasetsIds } = obj;
        obj.datasetsIds = datasetsIds.map((id, index, list) => {
            return matchCallback(id, list, index);
        });
    }
    traverseWizardFieldsRecursive(obj, matchCallback);
    return warnings;
};
const traverseQlFields = (obj, idMapping) => {
    const connection = obj.connection;
    const warnings = { missedMapping: false };
    const entryId = connection === null || connection === void 0 ? void 0 : connection.entryId;
    if (connection === null || connection === void 0 ? void 0 : connection.entryId) {
        if (idMapping[entryId]) {
            connection.entryId = idMapping[entryId];
        }
        else {
            warnings.missedMapping = true;
        }
    }
    return warnings;
};
const prepareImportChartData = async (chartOptions, req, idMapping) => {
    var _a, _b;
    const { ctx } = req;
    const description = (_b = (_a = chartOptions.annotation) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
    const defaults = {
        key: chartOptions.key,
        name: chartOptions.name,
        data: null,
        links: {},
        scope: types_1.EntryScope.Widget,
        mode: types_1.EntryUpdateMode.Publish,
        annotation: { description },
    };
    const notifications = [];
    let template;
    let chartTemplate;
    let shared = {};
    let warnings = null;
    try {
        shared = chartOptions.data.shared;
        const chartTemplateObj = chart_generator_1.chartGenerator.identifyChartTemplate({ ctx, shared });
        template = chartTemplateObj.type;
        chartTemplate = chartTemplateObj.chartTemplate;
        validateChartShared(chartOptions);
    }
    catch (err) {
        return {
            widget: null,
            notifications: [
                (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData, {
                    error: err.message,
                }),
            ],
        };
    }
    switch (template) {
        case 'datalens':
            warnings = traverseWizardFields(shared, idMapping);
            break;
        case 'ql':
            warnings = traverseQlFields(shared, idMapping);
            break;
        default:
            return {
                widget: null,
                notifications: [
                    (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData),
                ],
            };
    }
    if (warnings && warnings.missedMapping) {
        notifications.push((0, create_transfer_notifications_1.warningTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferMissingLinkedEndtry));
    }
    try {
        const links = Object.entries(chart_generator_1.chartGenerator.gatherChartLinks({
            req,
            shared,
            chartTemplate,
        }) || {}).reduce((acc, [key, value]) => {
            if (value !== workbook_transfer_1.TRANSFER_UNKNOWN_ENTRY_ID) {
                acc[key] = value;
            }
            return acc;
        }, {});
        const serializedData = chart_generator_1.chartGenerator.serializeShared({
            ctx,
            shared,
            links,
        });
        return {
            widget: {
                ...defaults,
                data: serializedData,
                type: chartOptions.type,
                links,
            },
            notifications,
        };
    }
    catch (err) {
        return {
            widget: null,
            notifications: [
                (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData, {
                    error: err.message,
                }),
            ],
        };
    }
};
exports.prepareImportChartData = prepareImportChartData;
const prepareExportChartData = async (entry, idMapping) => {
    var _a;
    let data;
    const { key, type, annotation } = entry;
    const name = (0, shared_1.getEntryNameByKey)({ key });
    const widget = {
        data,
        name,
        type,
        annotation,
    };
    const notifications = [];
    let warnings = null;
    let shared = {};
    try {
        shared = JSON.parse((((_a = entry.data) === null || _a === void 0 ? void 0 : _a.shared) || ''));
        const template = ((shared === null || shared === void 0 ? void 0 : shared.type) || '');
        switch (template) {
            case 'datalens':
                warnings = traverseWizardFields(shared, idMapping);
                break;
            case 'ql':
                warnings = traverseQlFields(shared, idMapping);
                break;
            default:
                return {
                    widget: null,
                    notifications: [
                        (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData),
                    ],
                };
        }
    }
    catch (err) {
        return {
            widget: null,
            notifications: [
                (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData, {
                    error: err.message,
                }),
            ],
        };
    }
    if (warnings && warnings.missedMapping) {
        notifications.push((0, create_transfer_notifications_1.warningTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferMissingLinkedEndtry));
    }
    return {
        widget: {
            ...widget,
            data: { shared },
        },
        notifications,
    };
};
exports.prepareExportChartData = prepareExportChartData;
