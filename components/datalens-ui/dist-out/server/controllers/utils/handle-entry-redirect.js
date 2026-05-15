"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEntryRedirect = handleEntryRedirect;
const shared_1 = require("../../../shared");
function handleEntryRedirect(entry, res) {
    switch (entry.scope) {
        case shared_1.EntryScope.Folder:
            return res.redirect(`/navigation/${entry.entryId}`);
        case shared_1.EntryScope.Dataset:
            return res.redirect(`/datasets/${entry.entryId}`);
        case shared_1.EntryScope.Widget:
            return res.redirect(`/wizard/${entry.entryId}`);
        case shared_1.EntryScope.Dash:
            return res.redirect(`/${entry.entryId}`);
        case shared_1.EntryScope.Connection:
            return res.redirect(`/connections/${entry.entryId}`);
        default:
            return res.redirect('/navigation');
    }
}
