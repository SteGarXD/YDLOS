"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
const isPlainObject_1 = __importDefault(require("lodash/isPlainObject"));
const AVAILABLE_META_TAB_KEYS = ['links'];
function validateMetaTab(tabContent) {
    if (!tabContent || typeof tabContent !== 'string') {
        return;
    }
    let metaTab;
    try {
        metaTab = JSON.parse(tabContent);
    }
    catch {
        throw new Error('Meta must be a valid JSON\n');
    }
    if (!(0, isPlainObject_1.default)(metaTab)) {
        throw new Error('Meta must be an object\n');
    }
    if ('links' in metaTab && !(0, isPlainObject_1.default)(metaTab.links)) {
        throw new Error('"links" property must be an object\n');
    }
    if (metaTab.links) {
        const unsupportedTypeKeys = [];
        Object.entries(metaTab.links).forEach(([key, value]) => {
            if (typeof value !== 'string') {
                unsupportedTypeKeys.push(key);
            }
        });
        if (unsupportedTypeKeys.length) {
            throw new Error(`Next keys in "links" property has unsupported types: ${unsupportedTypeKeys.join(', ')}. They must have a "string" type\n`);
        }
    }
    const unknownKeys = [];
    Object.keys(metaTab).forEach((key) => {
        if (!AVAILABLE_META_TAB_KEYS.includes(key)) {
            unknownKeys.push(key);
        }
    });
    if (unknownKeys.length) {
        throw new Error(`Unknown keys in tab "meta": ${unknownKeys.join(', ')}\n`);
    }
}
function validateData(data) {
    if (!data) {
        return;
    }
    validateMetaTab(data.meta);
}
