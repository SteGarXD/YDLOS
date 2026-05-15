"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.actions = void 0;
const dash_1 = require("./dash");
const editor_1 = require("./editor");
const entries_1 = require("./entries");
const markdown_1 = require("./markdown");
const navigation_1 = require("./navigation");
const ql_1 = require("./ql");
const wizard_1 = require("./wizard");
exports.actions = {
    ...navigation_1.navigationActions,
    ...entries_1.entriesActions,
    ...markdown_1.markdownActions,
    ...dash_1.dashActions,
    ...editor_1.editorActions,
    ...wizard_1.wizardActions,
    ...ql_1.qlActions,
};
