"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferCapabilities = exports.TransferErrorCode = exports.TRANSFER_UNKNOWN_ENTRY_ID = void 0;
const __1 = require("..");
exports.TRANSFER_UNKNOWN_ENTRY_ID = 'UNKNOWN_ENTRY';
var TransferErrorCode;
(function (TransferErrorCode) {
    TransferErrorCode["TransferInvalidVersion"] = "ERR.UI_API.TRANSFER_INVALID_VERSION";
    TransferErrorCode["TransferMissingLinkedEndtry"] = "ERR.UI_API.TRANSFER_MISSING_LINKED_ENTRY";
    TransferErrorCode["TransferInvalidEntryData"] = "ERR.UI_API.TRANSFER_INVALID_ENTRY_DATA";
    TransferErrorCode["TransferInvalidEntryScope"] = "ERR.UI_API.TRANSFER_INVALID_ENTRY_SCOPE";
    TransferErrorCode["TransferInvalidToken"] = "ERR.UI_API.TRANSFER_INVALID_TOKEN";
})(TransferErrorCode || (exports.TransferErrorCode = TransferErrorCode = {}));
exports.TransferCapabilities = {
    dependencies: {
        [__1.EntryScope.Connection]: [],
        [__1.EntryScope.Dataset]: [__1.EntryScope.Connection],
        [__1.EntryScope.Widget]: [__1.EntryScope.Dataset, __1.EntryScope.Connection],
        [__1.EntryScope.Dash]: [__1.EntryScope.Widget, __1.EntryScope.Dataset],
    },
};
