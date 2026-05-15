"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLegacyEditorEntryType = exports.isEditorEntryType = void 0;
const __1 = require("..");
const isEditorEntryType = (type) => {
    return __1.ENTRY_TYPES.editor.includes(type);
};
exports.isEditorEntryType = isEditorEntryType;
const isLegacyEditorEntryType = (type) => {
    return __1.ENTRY_TYPES.legacyEditor.includes(type);
};
exports.isLegacyEditorEntryType = isLegacyEditorEntryType;
