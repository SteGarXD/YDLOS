"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workbooksActions = void 0;
const copy_workbook_1 = require("./copy-workbook");
const create_workbook_1 = require("./create-workbook");
const delete_workbook_1 = require("./delete-workbook");
const delete_workbooks_1 = require("./delete-workbooks");
const get_workbook_1 = require("./get-workbook");
const get_workbook_entries_1 = require("./get-workbook-entries");
const get_workbooks_list_1 = require("./get-workbooks-list");
const migrate_entries_to_workbook_by_copy_1 = require("./migrate-entries-to-workbook-by-copy");
const migrate_entries_to_workbook_by_transfer_1 = require("./migrate-entries-to-workbook-by-transfer");
const move_workbook_1 = require("./move-workbook");
const move_workbooks_1 = require("./move-workbooks");
const update_workbook_1 = require("./update-workbook");
exports.workbooksActions = {
    createWorkbook: create_workbook_1.createWorkbook,
    getWorkbook: get_workbook_1.getWorkbook,
    getWorkbooksList: get_workbooks_list_1.getWorkbooksList,
    updateWorkbook: update_workbook_1.updateWorkbook,
    moveWorkbook: move_workbook_1.moveWorkbook,
    moveWorkbooks: move_workbooks_1.moveWorkbooks,
    deleteWorkbook: delete_workbook_1.deleteWorkbook,
    copyWorkbook: copy_workbook_1.copyWorkbook,
    deleteWorkbooks: delete_workbooks_1.deleteWorkbooks,
    getWorkbookEntries: get_workbook_entries_1.getWorkbookEntries,
    migrateEntriesToWorkbookByTransfer: migrate_entries_to_workbook_by_transfer_1.migrateEntriesToWorkbookByTransfer,
    migrateEntriesToWorkbookByCopy: migrate_entries_to_workbook_by_copy_1.migrateEntriesToWorkbookByCopy,
};
