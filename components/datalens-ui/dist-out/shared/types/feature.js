"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
var Feature;
(function (Feature) {
    Feature["ChartkitAlerts"] = "chartkitAlerts";
    Feature["UseConfigurableChartkit"] = "UseConfigurableChartkit";
    Feature["AsideHeaderEnabled"] = "AsideHeaderEnabled";
    Feature["FieldEditorDocSection"] = "FieldEditorDocSection";
    Feature["UsePublicDistincts"] = "UsePublicDistincts";
    Feature["EnablePublishEntry"] = "EnablePublishEntry";
    Feature["EnableChartEditorDocs"] = "EnableChartEditorDocs";
    Feature["EnableSaveAsEditorScript"] = "EnableSaveAsEditorScript";
    Feature["EnableCustomMonitoring"] = "EnableCustomMonitoring";
    Feature["EnableDashChartStat"] = "EnableDashChartStat";
    Feature["EnableAutocreateDataset"] = "EnableAutocreateDataset";
    Feature["ShowCreateEntryWithMenu"] = "ShowCreateEntryWithMenu";
    Feature["RevisionsListNoLimit"] = "RevisionsListNoLimit";
    Feature["AuthUpdateWithTimeout"] = "AuthUpdateWithTimeout";
    Feature["UseComponentHeader"] = "UseComponentHeader";
    Feature["FetchDocumentation"] = "FetchDocumentation";
    Feature["Comments"] = "Comments";
    // Check access rights when processing ChartEditor charts
    Feature["ChartEditorDeveloperModeCheck"] = "ChartEditorDeveloperModeCheck";
    Feature["QLPrometheus"] = "QLPrometheus";
    Feature["QLMonitoring"] = "QLMonitoring";
    Feature["CollectionsEnabled"] = "CollectionsEnabled";
    Feature["CollectionsAccessEnabled"] = "CollectionsAccessEnabled";
    Feature["DashBoardSupportDescription"] = "DashBoardSupportDescription";
    // Show request body in the Inspector dialog
    Feature["ShowInspectorDetails"] = "ShowInspectorDetails";
    // Prohibiting the serialization of functions in the chart configs
    Feature["NoJsonFn"] = "NoJsonFn";
    Feature["DatasetsRLS"] = "DatasetsRLS";
    // The ability to upload xlsx files for file connections
    Feature["XlsxFilesEnabled"] = "XlsxFilesEnabled";
    Feature["XlsxChartExportEnabled"] = "XlsxChartExportEnabled";
    Feature["HolidaysOnChart"] = "HolidaysOnChart";
    Feature["ReadOnlyMode"] = "ReadOnlyMode";
    Feature["MenuItemsFlatView"] = "MenuItemsFlatView";
    Feature["EntryMenuItemCopy"] = "EntryMenuItemCopy";
    Feature["EntryMenuItemMove"] = "EntryMenuItemMove";
    Feature["ExternalSelectors"] = "ExternalSelectors";
    Feature["DashBoardWidgetParamsStrictValidation"] = "DashBoardWidgetParamsStrictValidation";
    Feature["D3Visualizations"] = "D3Visualizations";
    Feature["HideMultiDatasets"] = "HideMultiDatasets";
    Feature["ShouldCheckEditorAccess"] = "ShouldCheckEditorAccess";
    Feature["HideMultitenant"] = "HideMultitenant";
    Feature["EnableMobileHeader"] = "EnableMobileHeader";
    Feature["UseYqlFolderKey"] = "UseYqlFolderKey";
    Feature["ShowChartsEngineDebugInfo"] = "ShowChartsEngineDebugInfo";
    Feature["UseChartsEngineResponseConfig"] = "UseChartsEngineResponseConfig";
    Feature["UseChartsEngineLogin"] = "UseChartsEngineLogin";
    Feature["CopyEntriesToWorkbook"] = "CopyEntriesToWorkbook";
    Feature["QlAutoExecuteMonitoringChart"] = "QlAutoExecuteMonitoringChart";
    Feature["MultipleColorsInVisualization"] = "MultipleColorsInVisualization";
    Feature["ConnectionBasedControl"] = "ConnectionBasedControl";
    Feature["EnableServerlessEditor"] = "EnableServerlessEditor";
    Feature["EnableFooter"] = "EnableFooter";
    Feature["MassRemoveCollectionsWorkbooks"] = "MassRemoveCollectionsWorkbooks";
    Feature["EnableEmbedsInDialogShare"] = "EnableEmbedsInDialogShare";
    Feature["EnableEntryMenuItemShare"] = "EnableEntryMenuItemShare";
    Feature["NewTableWidgetForCE"] = "NewTableWidgetForCE";
    /** Disable the use of html and function in chart configs */
    Feature["DisableFnAndHtml"] = "DisableFnAndHtml";
    /** Enable using of presigned urls for uploading files to S3 */
    Feature["EnableFileUploadingByPresignedUrl"] = "EnableFileUploadingByPresignedUrl";
    /** Enables export menu item for downloading workbook config and import button
     * when creating a workbook */
    Feature["EnableExportWorkbookFile"] = "EnableExportWorkbookFile";
    /** Enable using RLS v2 config for datasets */
    Feature["EnableRLSV2"] = "EnableRLSV2";
    /* Enable Dash server entry validation */
    Feature["DashServerValidationEnable"] = "DashServerValidationEnable";
    /* Enable Dash server entry migrations */
    Feature["DashServerMigrationEnable"] = "DashServerMigrationEnable";
    /** Enable custom dashboard gaps */
    Feature["EnableCustomDashMargins"] = "EnableCustomDashMargins";
    /** Enabled Dash elements auto-focus */
    Feature["EnableDashAutoFocus"] = "EnableDashAutoFocus";
    /** Enable new secure parameters behavior */
    Feature["EnableSecureParamsV2"] = "EnableSecureParamsV2";
    /** Enable export settings in connections & datasets */
    Feature["EnableExportSettings"] = "EnableExportSettings";
    /** Enable updating dataset settings by action ('load_preview_by_default' | 'template_enabled' | 'data_export_forbidden') */
    Feature["EnableUpdatingDsSettingsByAction"] = "EnableUpdatingDsSettingsByAction";
    /** Enable new favicon, icon, theme, decorations and illustrations */
    Feature["EnableDLRebranding"] = "EnableDLRebranding";
    /** Use GravityUI Charts as the default library for some wizard visualizations(pie, donut, treemap) */
    Feature["GravityChartsForPieAndTreemap"] = "GravityChartsForPieAndTreemap";
    /** Use GravityUI Charts as the default library for some wizard visualizations(scatter and bar-y) */
    Feature["GravityChartsForBarYAndScatter"] = "GravityChartsForBarYAndScatter";
    /** Use GravityUI Charts as the default library for some wizard visualizations(line, area and bar-x) */
    Feature["GravityChartsForLineAreaAndBarX"] = "GravityChartsForLineAreaAndBarX";
    /** Show dataset description button */
    Feature["EnableDatasetDescription"] = "EnableDatasetDescription";
    /** Show connection description button */
    Feature["EnableConnectionDescription"] = "EnableConnectionDescription";
    /** Enable pagination in dataset sources table */
    Feature["EnableDatasetSourcesPagination"] = "EnableDatasetSourcesPagination";
    /** Enable shared connections and datasets */
    Feature["EnableSharedEntries"] = "EnableSharedEntries";
    Feature["EnableMobileFixedHeader"] = "EnableMobileFixedHeader";
    /** enabled redesign/moving to drawers existing settings */
    Feature["EnableCommonChartDashSettings"] = "EnableCommonChartDashSettings";
    /** enables new dash & widgets settings */
    Feature["EnableNewDashSettings"] = "EnableNewDashSettings";
    /** Shows updated settings page */
    Feature["EnableNewServiceSettings"] = "EnableNewServiceSettings";
    Feature["EnableTenantSettingPalettes"] = "EnableTenantSettingPalettes";
})(Feature || (exports.Feature = Feature = {}));
