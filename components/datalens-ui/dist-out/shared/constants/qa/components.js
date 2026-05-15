"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatalensHeaderQa = exports.DatalensTabs = exports.PreviewQa = exports.DocSectionQa = exports.DialogDashWidgetQA = exports.DialogDashTitleQA = exports.DialogDashWidgetItemQA = exports.DialogDraftWarningQA = exports.DialogWarningQA = exports.DialogInfoQA = exports.DialogConfirmQA = exports.TabMenuQA = exports.NavigationInputQA = exports.ParamsSettingsQA = exports.MenuItemsQA = exports.EntryDialogQA = exports.DialogTabsQA = exports.AddFieldQA = exports.DialogParameterQA = exports.SaveChartControlsQa = exports.RevisionsListQa = exports.RevisionsPanelQa = exports.ActionPanelQA = void 0;
var ActionPanelQA;
(function (ActionPanelQA) {
    ActionPanelQA["MoreBtn"] = "entry-panel-more-btn";
    ActionPanelQA["ActionPanel"] = "entry-action-panel";
    ActionPanelQA["EntryBreadcrumbs"] = "entry-breadcrumbs";
})(ActionPanelQA || (exports.ActionPanelQA = ActionPanelQA = {}));
var RevisionsPanelQa;
(function (RevisionsPanelQa) {
    RevisionsPanelQa["RevisionsPanel"] = "revisions-top-panel";
    RevisionsPanelQa["DraftVersion"] = "revisions-top-panel-draft-version";
    RevisionsPanelQa["NotActualVersion"] = "revisions-top-panel-not-actual-version";
    RevisionsPanelQa["HasDraft"] = "revisions-top-panel-has-draft";
    RevisionsPanelQa["ButtonOpenActual"] = "revisions-button-open-actual";
    RevisionsPanelQa["ButtonMakeActual"] = "revisions-button-make-actual";
})(RevisionsPanelQa || (exports.RevisionsPanelQa = RevisionsPanelQa = {}));
var RevisionsListQa;
(function (RevisionsListQa) {
    RevisionsListQa["ExpandablePanel"] = "expandable-panel";
    RevisionsListQa["ExpandablePanelButtonClose"] = "expandable-panel-close-btn";
    RevisionsListQa["List"] = "revisions-list";
    RevisionsListQa["RevisionsListRow"] = "revisions-list-row";
    RevisionsListQa["RevisionsListRowDraft"] = "revisions-list-row-draft";
    RevisionsListQa["RevisionsListRowActual"] = "revisions-list-row-actual";
    RevisionsListQa["RevisionsListRowNotActual"] = "revisions-list-row-not-actual";
})(RevisionsListQa || (exports.RevisionsListQa = RevisionsListQa = {}));
var SaveChartControlsQa;
(function (SaveChartControlsQa) {
    SaveChartControlsQa["SaveButton"] = "action-panel-save-btn";
})(SaveChartControlsQa || (exports.SaveChartControlsQa = SaveChartControlsQa = {}));
var DialogParameterQA;
(function (DialogParameterQA) {
    DialogParameterQA["Apply"] = "dialog_parameter-apply-btn";
    DialogParameterQA["Cancel"] = "dialog_parameter-cancel-btn";
    DialogParameterQA["Reset"] = "dialog_parameter-reset-btn";
    DialogParameterQA["DefaultValueInput"] = "dialog_parameter-default-value-input";
    DialogParameterQA["DefaultValueRadioGroup"] = "dialog_parameter-default-value-radio-group";
    DialogParameterQA["NameInput"] = "dialog_parameter-name-input";
    DialogParameterQA["TypeSelector"] = "dialog_parameter-type_selector";
    DialogParameterQA["Dialog"] = "dialog-parameter";
})(DialogParameterQA || (exports.DialogParameterQA = DialogParameterQA = {}));
var AddFieldQA;
(function (AddFieldQA) {
    AddFieldQA["Option"] = "add-field-option";
    AddFieldQA["AddFieldButton"] = "add-field-button";
    AddFieldQA["MeasureFieldIcon"] = "add-measure-field-icon";
    AddFieldQA["DimensionsFieldIcon"] = "add-dimension-field-icon";
})(AddFieldQA || (exports.AddFieldQA = AddFieldQA = {}));
var DialogTabsQA;
(function (DialogTabsQA) {
    DialogTabsQA["Dialog"] = "dialog-tabs";
    DialogTabsQA["PopupWidgetOrder"] = "popup-widget-order";
    DialogTabsQA["PopupWidgetOrderList"] = "popup-widget-order-list";
    DialogTabsQA["TabItemMenu"] = "tab-item-menu";
    DialogTabsQA["TabItemMenuOrder"] = "tab-item-menu-order";
    DialogTabsQA["RowAdd"] = "dialog-tabs-row-add";
    DialogTabsQA["Save"] = "dialog-tabs-save-button";
    DialogTabsQA["Cancel"] = "dialog-tabs-cancel-button";
    DialogTabsQA["EditTabItem"] = "edit-tab-input";
    DialogTabsQA["ReadOnlyTabItem"] = "read-only-tab-item";
})(DialogTabsQA || (exports.DialogTabsQA = DialogTabsQA = {}));
var EntryDialogQA;
(function (EntryDialogQA) {
    EntryDialogQA["Apply"] = "entry-dialog-apply-button";
    EntryDialogQA["Cancel"] = "entry-dialog-cancel-button";
    EntryDialogQA["Reset"] = "entry-dialog-reset-button";
    EntryDialogQA["FolderSelect"] = "entry-dialog-select";
    EntryDialogQA["Content"] = "entry-dialog-content";
    EntryDialogQA["PathSelect"] = "path-select";
})(EntryDialogQA || (exports.EntryDialogQA = EntryDialogQA = {}));
var MenuItemsQA;
(function (MenuItemsQA) {
    MenuItemsQA["EXPORT"] = "export";
    MenuItemsQA["EXPORT_CSV"] = "exportCsv";
    MenuItemsQA["EXPORT_MARKDOWN"] = "exportMarkdown";
    MenuItemsQA["EXPORT_SCREENSHOT"] = "exportScreenshot";
    MenuItemsQA["INSPECTOR"] = "inspector";
    MenuItemsQA["NEW_WINDOW"] = "openInNewWindow";
    MenuItemsQA["GET_LINK"] = "getLink";
    MenuItemsQA["ALERTS"] = "alerts";
})(MenuItemsQA || (exports.MenuItemsQA = MenuItemsQA = {}));
var ParamsSettingsQA;
(function (ParamsSettingsQA) {
    ParamsSettingsQA["Settings"] = "params-settings";
    ParamsSettingsQA["Open"] = "params-settings-open-btn";
    ParamsSettingsQA["Add"] = "params-settings-add-btn";
    ParamsSettingsQA["Remove"] = "params-settings-remove-btn";
    ParamsSettingsQA["RemoveAll"] = "params-settings-remove-all-btn";
    ParamsSettingsQA["ParamRow"] = "params-settings-param-row";
    ParamsSettingsQA["ParamTitle"] = "params-settings-param-title";
    ParamsSettingsQA["ParamValue"] = "params-settings-param-value";
    ParamsSettingsQA["ParamAddValue"] = "params-settings-param-add-value-btn";
})(ParamsSettingsQA || (exports.ParamsSettingsQA = ParamsSettingsQA = {}));
var NavigationInputQA;
(function (NavigationInputQA) {
    NavigationInputQA["Apply"] = "navigation-input-ok-button";
    NavigationInputQA["Input"] = "navigation-input";
    NavigationInputQA["Link"] = "navigation-input-use-link-button";
    NavigationInputQA["Open"] = "navigation-input-open-button";
})(NavigationInputQA || (exports.NavigationInputQA = NavigationInputQA = {}));
var TabMenuQA;
(function (TabMenuQA) {
    TabMenuQA["List"] = "tab-menu-list";
    TabMenuQA["Item"] = "tab-menu-list-item";
    TabMenuQA["ItemRemove"] = "tab-menu-list-item-remove";
    TabMenuQA["Add"] = "tab-menu-add";
    TabMenuQA["Paste"] = "tab-menu-paste";
})(TabMenuQA || (exports.TabMenuQA = TabMenuQA = {}));
var DialogConfirmQA;
(function (DialogConfirmQA) {
    DialogConfirmQA["Dialog"] = "dialog-confirm";
    DialogConfirmQA["ApplyButton"] = "dialog-confirm-apply-button";
    DialogConfirmQA["CancelButton"] = "dialog-confirm-cancel-button";
})(DialogConfirmQA || (exports.DialogConfirmQA = DialogConfirmQA = {}));
var DialogInfoQA;
(function (DialogInfoQA) {
    DialogInfoQA["Dialog"] = "dialog-info";
    DialogInfoQA["CloseButton"] = "dialog-close-button";
})(DialogInfoQA || (exports.DialogInfoQA = DialogInfoQA = {}));
var DialogWarningQA;
(function (DialogWarningQA) {
    DialogWarningQA["Dialog"] = "dialog-warning";
    DialogWarningQA["ApplyButton"] = "dialog-warning-apply-button";
})(DialogWarningQA || (exports.DialogWarningQA = DialogWarningQA = {}));
var DialogDraftWarningQA;
(function (DialogDraftWarningQA) {
    DialogDraftWarningQA["Dialog"] = "dialog-draft-warning";
    DialogDraftWarningQA["EditButton"] = "dialog-draft-warning-edit-btn";
})(DialogDraftWarningQA || (exports.DialogDraftWarningQA = DialogDraftWarningQA = {}));
var DialogDashWidgetItemQA;
(function (DialogDashWidgetItemQA) {
    DialogDashWidgetItemQA["Text"] = "dialog_widget-text";
    DialogDashWidgetItemQA["Title"] = "dialog_widget-title";
    DialogDashWidgetItemQA["Image"] = "dialog_widget-image";
})(DialogDashWidgetItemQA || (exports.DialogDashWidgetItemQA = DialogDashWidgetItemQA = {}));
var DialogDashTitleQA;
(function (DialogDashTitleQA) {
    DialogDashTitleQA["Input"] = "dialog-dash-title-input";
})(DialogDashTitleQA || (exports.DialogDashTitleQA = DialogDashTitleQA = {}));
var DialogDashWidgetQA;
(function (DialogDashWidgetQA) {
    DialogDashWidgetQA["Apply"] = "dialog_widget-apply-btn";
    DialogDashWidgetQA["Cancel"] = "dialog_widget-cancel-btn";
})(DialogDashWidgetQA || (exports.DialogDashWidgetQA = DialogDashWidgetQA = {}));
var DocSectionQa;
(function (DocSectionQa) {
    DocSectionQa["Group"] = "doc-section-group";
    DocSectionQa["Item"] = "doc-section-item";
    DocSectionQa["Title"] = "doc-item-title";
})(DocSectionQa || (exports.DocSectionQa = DocSectionQa = {}));
var PreviewQa;
(function (PreviewQa) {
    PreviewQa["ChartWrapper"] = "preview-chart-wrapper";
})(PreviewQa || (exports.PreviewQa = PreviewQa = {}));
var DatalensTabs;
(function (DatalensTabs) {
    DatalensTabs["MobileItem"] = "dash-mobile-tab-item";
    DatalensTabs["Item"] = "dash-tab-item";
    DatalensTabs["SwitcherItem"] = "dash-tab-switcher-item";
})(DatalensTabs || (exports.DatalensTabs = DatalensTabs = {}));
var DatalensHeaderQa;
(function (DatalensHeaderQa) {
    DatalensHeaderQa["DesktopContainer"] = "datalens-header-desktop-container";
    DatalensHeaderQa["MobileContainer"] = "datalens-header-mobile-container";
})(DatalensHeaderQa || (exports.DatalensHeaderQa = DatalensHeaderQa = {}));
