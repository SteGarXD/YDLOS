"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const collections_1 = require("./collections");
const color_palettes_1 = require("./color-palettes");
const editor_1 = require("./editor");
const embeds_1 = require("./embeds");
const entries_1 = require("./entries");
const favorites_1 = require("./favorites");
const locks_1 = require("./locks");
const operations_1 = require("./operations");
const presets_1 = require("./presets");
const private_1 = require("./private");
const state_1 = require("./state");
const template_1 = require("./template");
const tenant_1 = require("./tenant");
const user_1 = require("./user");
const workbooks_1 = require("./workbooks");
exports.actions = {
    ...entries_1.entriesActions,
    ...presets_1.presetsActions,
    ...locks_1.locksActions,
    ...favorites_1.favoritesActions,
    ...editor_1.editorActions,
    ...state_1.stateActions,
    ...user_1.userActions,
    ...template_1.templateActions,
    ...private_1.privateActions,
    ...collections_1.collectionsActions,
    ...workbooks_1.workbooksActions,
    ...color_palettes_1.colorPalettesActions,
    ...embeds_1.embedsActions,
    ...operations_1.operationsActions,
    ...tenant_1.tenantActions,
};
