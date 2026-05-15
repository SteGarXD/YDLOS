"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onFail = onFail;
exports.onMissingEntry = onMissingEntry;
exports.defaultOnFail = defaultOnFail;
const components_1 = require("../components");
const page_error_1 = require("./page-error");
async function onFail(req, res) {
    res.status(500).send(await (0, components_1.getLandingLayout)(req, res, (0, page_error_1.getError)(req).onFail));
}
async function onMissingEntry(req, res) {
    res.status(404).send(await (0, components_1.getLandingLayout)(req, res, (0, page_error_1.getError)(req).onMissingEntry));
}
function defaultOnFail(_, res) {
    res.status(500).send({ message: 'Internal server error' });
}
