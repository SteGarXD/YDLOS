"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeveloperModeCheckStatus = exports.EntryUpdateMode = exports.EntryScope = void 0;
var EntryScope;
(function (EntryScope) {
    EntryScope["Dash"] = "dash";
    EntryScope["Widget"] = "widget";
    EntryScope["Dataset"] = "dataset";
    EntryScope["Folder"] = "folder";
    EntryScope["Connection"] = "connection";
})(EntryScope || (exports.EntryScope = EntryScope = {}));
var EntryUpdateMode;
(function (EntryUpdateMode) {
    EntryUpdateMode["Save"] = "save";
    EntryUpdateMode["Publish"] = "publish";
})(EntryUpdateMode || (exports.EntryUpdateMode = EntryUpdateMode = {}));
var DeveloperModeCheckStatus;
(function (DeveloperModeCheckStatus) {
    DeveloperModeCheckStatus["Allowed"] = "allowed";
    DeveloperModeCheckStatus["Forbidden"] = "forbidden";
})(DeveloperModeCheckStatus || (exports.DeveloperModeCheckStatus = DeveloperModeCheckStatus = {}));
