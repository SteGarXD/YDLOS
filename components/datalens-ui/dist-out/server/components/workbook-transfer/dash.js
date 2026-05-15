"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDashImportData = prepareDashImportData;
exports.prepareDashExportData = prepareDashExportData;
const shared_1 = require("../../../shared");
const workbook_transfer_1 = require("../../../shared/constants/workbook-transfer");
const dash_1 = __importDefault(require("../sdk/dash"));
const create_transfer_notifications_1 = require("./create-transfer-notifications");
async function prepareDashImportData(entryData, idMapping) {
    var _a, _b;
    const data = await dash_1.default.migrate(entryData.data);
    const notifications = [];
    const description = (_b = (_a = entryData.annotation) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
    const defaults = {
        name: entryData.name,
        scope: shared_1.EntryScope.Dash,
        mode: shared_1.EntryUpdateMode.Publish,
        links: {},
        type: '',
        key: '',
        annotation: { description },
    };
    try {
        let isMissingMapping = false;
        dash_1.default.processLinks(data, (value, obj, key) => {
            if (idMapping[value]) {
                obj[key] = idMapping[value];
                return idMapping[value];
            }
            else {
                isMissingMapping = true;
            }
            return value;
        });
        if (isMissingMapping) {
            notifications.push((0, create_transfer_notifications_1.warningTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferMissingLinkedEndtry));
        }
        dash_1.default.validateData(data);
    }
    catch (err) {
        return {
            dash: null,
            notifications: [
                (0, create_transfer_notifications_1.criticalTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferInvalidEntryData),
            ],
        };
    }
    const links = Object.entries(dash_1.default.gatherLinks(data) || {}).reduce((acc, [key, value]) => {
        if (value !== workbook_transfer_1.TRANSFER_UNKNOWN_ENTRY_ID) {
            acc[key] = value;
        }
        return acc;
    }, {});
    return {
        dash: {
            ...defaults,
            data,
            links,
        },
        notifications,
    };
}
async function prepareDashExportData(entry, idMapping) {
    const data = await dash_1.default.migrate(entry.data);
    const notifications = [];
    let isMissingMapping = false;
    dash_1.default.processLinks(data, (val, obj, key) => {
        const mappedValue = idMapping[val];
        if (mappedValue) {
            obj[key] = mappedValue;
            return mappedValue;
        }
        isMissingMapping = true;
        return workbook_transfer_1.TRANSFER_UNKNOWN_ENTRY_ID;
    });
    if (isMissingMapping) {
        notifications.push((0, create_transfer_notifications_1.warningTransferNotification)(workbook_transfer_1.TransferErrorCode.TransferMissingLinkedEndtry));
    }
    const name = (0, shared_1.getEntryNameByKey)({ key: entry.key });
    const dash = {
        name,
        data,
        annotation: entry.annotation,
    };
    return {
        dash,
        notifications,
    };
}
