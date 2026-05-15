"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashTabsQA = exports.DashBodyQa = exports.DashkitQa = exports.DashRelationTypes = exports.FixedHeaderQa = exports.DashCommonQa = exports.TableOfContentQa = exports.DashEntryQa = exports.DashRevisions = exports.DashLoadPrioritySettings = void 0;
var DashLoadPrioritySettings;
(function (DashLoadPrioritySettings) {
    DashLoadPrioritySettings["charts"] = "charts";
    DashLoadPrioritySettings["selectors"] = "selectors";
})(DashLoadPrioritySettings || (exports.DashLoadPrioritySettings = DashLoadPrioritySettings = {}));
var DashRevisions;
(function (DashRevisions) {
    DashRevisions["EXPANDABLE_PANEL"] = "expandable-panel";
    DashRevisions["EXPANDABLE_PANEL_COLLAPSED_BTN"] = "expandable-panel-toggle-btn-collapsed";
    DashRevisions["EXPANDABLE_PANEL_EXPANDED_BTN"] = "expandable-panel-toggle-btn-expanded";
})(DashRevisions || (exports.DashRevisions = DashRevisions = {}));
var DashEntryQa;
(function (DashEntryQa) {
    DashEntryQa["EntryName"] = "dash-entry-name";
    DashEntryQa["TableOfContent"] = "table-of-content";
})(DashEntryQa || (exports.DashEntryQa = DashEntryQa = {}));
var TableOfContentQa;
(function (TableOfContentQa) {
    TableOfContentQa["TableOfContent"] = "table-of-content";
    TableOfContentQa["CloseBtn"] = "table-of-content-close";
    TableOfContentQa["MobileTableOfContent"] = "mobile-table-of-content";
})(TableOfContentQa || (exports.TableOfContentQa = TableOfContentQa = {}));
var DashCommonQa;
(function (DashCommonQa) {
    DashCommonQa["RelationTypeButton"] = "relation-type-btn";
    DashCommonQa["AliasSelectLeft"] = "alias-first-select";
    DashCommonQa["AliasSelectRight"] = "alias-second-select";
    DashCommonQa["AliasAddBtn"] = "alias-add-new-btn";
    DashCommonQa["AliasAddApplyBtn"] = "alias-add-new-apply-btn";
    DashCommonQa["AliasesCancelBtn"] = "aliases-dialog-cancel-btn";
    DashCommonQa["AliasShowBtn"] = "alias-show-btn";
    DashCommonQa["AliasesListCollapse"] = "aliases-list-collapse-btn";
    DashCommonQa["AliasRemoveBtn"] = "alias-remove-btn";
    DashCommonQa["AliasItem"] = "alias-row-item";
    DashCommonQa["RelationsApplyBtn"] = "relations-apply-btn";
    DashCommonQa["RelationsCancelBtn"] = "relations-cancel-btn";
    DashCommonQa["WidgetShowTitleCheckbox"] = "dialog-widget-settings-show-title";
    DashCommonQa["WidgetEnableAutoHeightCheckbox"] = "dialog-widget-settings-enable-autoheight";
    DashCommonQa["WidgetEnableBackgroundCheckbox"] = "dialog-widget-settings-enable-background";
    DashCommonQa["WidgetSelectBackgroundButton"] = "dialog-widget-settings-select-background-button";
    DashCommonQa["WidgetSelectBackgroundPalleteContainer"] = "dialog-widget-settings-select-background-pallete-container";
    DashCommonQa["RelationsDialogEmptyText"] = "dialog-relations-empty-text";
    DashCommonQa["RelationsWidgetSelect"] = "dialog-relations-widget-select";
    DashCommonQa["RelationsDisconnectAllSwitcher"] = "dialog-relations-disconnect-all-switcher";
    DashCommonQa["RelationsDisconnectAllSelectors"] = "dialog-relations-disconnect-all-selectors";
    DashCommonQa["RelationsDisconnectAllWidgets"] = "dialog-relations-disconnect-all-widgets";
    DashCommonQa["RelationsDisconnectAllCharts"] = "dialog-relations-disconnect-all-charts";
    DashCommonQa["RelationsListRow"] = "dialog-relations-list-row";
    DashCommonQa["RelationsRowPopover"] = "dialog-relations-row-popover";
})(DashCommonQa || (exports.DashCommonQa = DashCommonQa = {}));
var FixedHeaderQa;
(function (FixedHeaderQa) {
    FixedHeaderQa["Wrapper"] = "dash-fixed-header-wrapper";
    FixedHeaderQa["Container"] = "dash-fixed-header-containter";
    FixedHeaderQa["Controls"] = "dash-fixed-header-controls";
    FixedHeaderQa["ExpandCollapseButton"] = "dash-fixed-header-expand-collapse-button";
})(FixedHeaderQa || (exports.FixedHeaderQa = FixedHeaderQa = {}));
var DashRelationTypes;
(function (DashRelationTypes) {
    DashRelationTypes["output"] = "relation-type-option-output";
    DashRelationTypes["input"] = "relation-type-option-input";
    DashRelationTypes["ignore"] = "relation-type-option-ignore";
    DashRelationTypes["both"] = "relation-type-option-both";
    DashRelationTypes["unknown"] = "relation-type-option-unknown";
})(DashRelationTypes || (exports.DashRelationTypes = DashRelationTypes = {}));
var DashkitQa;
(function (DashkitQa) {
    DashkitQa["GRID_ITEM"] = "dashkit-grid-item";
})(DashkitQa || (exports.DashkitQa = DashkitQa = {}));
var DashBodyQa;
(function (DashBodyQa) {
    DashBodyQa["App"] = "dash-app";
    DashBodyQa["ContentWrapper"] = "dash-body-content-wrapper";
})(DashBodyQa || (exports.DashBodyQa = DashBodyQa = {}));
var DashTabsQA;
(function (DashTabsQA) {
    DashTabsQA["Root"] = "dash-tabs";
})(DashTabsQA || (exports.DashTabsQA = DashTabsQA = {}));
