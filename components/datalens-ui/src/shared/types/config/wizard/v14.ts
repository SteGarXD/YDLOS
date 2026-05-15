import type {
    GradientNullMode,
    MapCenterModes,
    MarkupType,
    MetricFontSettings,
    WidgetSizeType,
    ZoomModes,
} from '../../..';
import type {ColorMode} from '../../../constants';
import type {DatasetFieldCalcMode, ParameterDefaultValue} from '../../dataset';
import type {NumberFormatType, NumberFormatUnit} from '../../formatting';
import type {
    AxisLabelFormatMode,
    AxisMode,
    AxisNullsMode,
    ChartsConfigVersion,
    ColumnSettings,
    HintSettings,
    IndicatorTitleMode,
    LabelsPositions,
    TableBarsSettings,
    TableFieldBackgroundSettings,
    TableSubTotalsSettings,
} from '../../wizard';

export type V14ChartsConfig = {
    title?: string;
    colors: V14Color[];
    colorsConfig?: V14ColorsConfig;
    extraSettings: V14CommonSharedExtraSettings | undefined;
    filters: V14Filter[];
    geopointsConfig?: V14PointSizeConfig;
    hierarchies: V14HierarchyField[];
    labels: V14Label[];
    links: V14Link[];
    sort: V14Sort[];
    tooltips: V14Tooltip[];
    tooltipConfig?: V14TooltipConfig;
    type: 'datalens';
    updates: V14Update[];
    visualization: V14Visualization;
    shapes: V14Shape[];
    shapesConfig?: V14ShapesConfig;
    version: ChartsConfigVersion.V14;
    datasetsIds: string[];
    datasetsPartialFields: V14ChartsConfigDatasetField[][];
    segments: V14Field[];
    chartType?: string;
};

export type V14Update = {
    action: 'add_field' | 'add' | 'update_field' | 'update' | 'delete' | 'delete_field';
    field: any;
    debug_info?: string;
};

/** Flat table: flight → segments tree and total row in preparer (no TREE() in SQL). */
export type V14FlatTableRowTreeAutoClassTotal = {
    fieldFGuid: string;
    fieldCGuid: string;
    fieldYGuid: string;
    targetMeasureGuid: string;
};

export type V14FlatTableRowTreeSettings = {
    enabled: true;
    flightFieldGuid: string;
    segmentFieldGuid: string;
    /** Label in segment column on parent row; default «Всего» */
    totalLabel?: string;
    /**
     * Fill target measure with F+C+Y on every row (and in group totals).
     * If omitted and three consecutive numeric columns are titled F, C, Y, the next numeric column
     * (e.g. «Всего») is used as the target automatically.
     */
    autoClassTotal?: V14FlatTableRowTreeAutoClassTotal;
};

export type V14CommonSharedExtraSettings = {
    title?: string;
    titleMode?: 'show' | 'hide';
    indicatorTitleMode?: IndicatorTitleMode;
    legendMode?: 'show' | 'hide';
    tooltip?: 'show' | 'hide';
    tooltipSum?: 'on' | 'off';
    limit?: number;
    pagination?: 'on' | 'off';
    navigatorMode?: string;
    navigatorSeriesName?: string;
    totals?: 'on' | 'off';
    pivotFallback?: 'on' | 'off';
    pivotInlineSort?: 'on' | 'off';
    stacking?: 'on' | 'off';
    overlap?: 'on' | 'off';
    feed?: string;
    navigatorSettings?: V14NavigatorSettings;
    enableGPTInsights?: boolean;
    labelsPosition?: LabelsPositions;
    pinnedColumns?: number;
    size?: WidgetSizeType;
    zoomMode?: ZoomModes;
    zoomValue?: number | null;
    mapCenterMode?: MapCenterModes;
    mapCenterValue?: string | null;
    preserveWhiteSpace?: boolean;
    flatTableRowTree?: V14FlatTableRowTreeSettings;
    customizationProfileId?: string;
    customization?: {
        pie?: {
            slicedOffset?: number;
            pointOffset?: number;
            borderWidth?: number;
            borderColor?: string;
            titleFontSize?: number;
            titleFontWeight?: string;
            legend?: {
                position?: 'right' | 'bottom';
                width?: number;
                margin?: number;
                itemDistance?: number;
                itemFontSize?: string;
                symbolType?: 'rect' | 'circle';
                symbolWidth?: number;
                symbolHeight?: number;
                symbolRadius?: number;
                symbolPadding?: number;
            };
        };
        table?: {
            headerBg?: string;
            headerColor?: string;
            bodyBg?: string;
            bodyColor?: string;
            footerBg?: string;
            footerColor?: string;
            borderColor?: string;
            priority?: Array<'header' | 'body' | 'footer'>;
            flat?: {
                headerBg?: string;
                headerColor?: string;
                bodyBg?: string;
                bodyColor?: string;
                footerBg?: string;
                footerColor?: string;
                borderColor?: string;
                headerBorderColor?: string;
                bodyBorderColor?: string;
                footerBorderColor?: string;
                totalBorderColor?: string;
                headerFontSize?: number;
                bodyFontSize?: number;
                footerFontSize?: number;
                headerFontWeight?: string;
                bodyFontWeight?: string;
                footerFontWeight?: string;
                columnWidth?: number;
                rowHeight?: number;
                headerAlign?: 'left' | 'center' | 'right';
                bodyAlign?: 'left' | 'center' | 'right';
                footerAlign?: 'left' | 'center' | 'right';
                cellPaddingX?: number;
                showHeader?: boolean;
                showFooter?: boolean;
                showTotals?: boolean;
                zebraOddBg?: string;
                zebraEvenBg?: string;
                conditionalRules?: Array<{
                    op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                    value?: string | number;
                    valueTo?: string | number;
                    bg?: string;
                    color?: string;
                    targetFields?: string[];
                    targetZone?: 'header' | 'body' | 'footer' | 'total';
                    targetTreeLevel?: number;
                    contextContains?: string;
                    contextDateFrom?: string;
                    contextDateTo?: string;
                    logic?: 'AND' | 'OR';
                    conditions?: Array<{
                        op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                        value?: string | number;
                        valueTo?: string | number;
                    }>;
                }>;
                columnStyles?: Record<
                    string,
                    {
                        width?: number;
                        bg?: string;
                        color?: string;
                        align?: 'left' | 'center' | 'right';
                        fontWeight?: string;
                        hide?: boolean;
                        pin?: boolean;
                        order?: number;
                        displayTitle?: string;
                    }
                >;
                columnFormats?: Record<string, 'integer' | 'percent1' | 'currency0'>;
                customNumberMasks?: Record<string, string>;
                locale?: string;
                currency?: string;
                suffix?: string;
                stylePriority?: Array<'preset' | 'zone' | 'rule' | 'column'>;
                densityProfile?: 'compact' | 'normal' | 'legacy-desktop';
                headerSkin?: 'default' | 'classic-blue' | 'flat-light';
                emptyCellPolicy?: 'blank' | 'zero' | 'dash';
                thresholdPack?: 'none' | 'zpk-traffic' | 'kpi-soft';
                semanticSlots?: Record<string, string>;
                semanticSlotStyles?: Record<
                    string,
                    {
                        bg?: string;
                        color?: string;
                        fontWeight?: string;
                        align?: 'left' | 'center' | 'right';
                    }
                >;
                viewModePresets?: Array<{id: string; name: string; settings: Record<string, unknown>}>;
                priority?: Array<'header' | 'body' | 'footer'>;
            };
            pivot?: {
                headerBg?: string;
                headerColor?: string;
                bodyBg?: string;
                bodyColor?: string;
                footerBg?: string;
                footerColor?: string;
                borderColor?: string;
                headerBorderColor?: string;
                bodyBorderColor?: string;
                footerBorderColor?: string;
                totalBorderColor?: string;
                headerFontSize?: number;
                bodyFontSize?: number;
                footerFontSize?: number;
                headerFontWeight?: string;
                bodyFontWeight?: string;
                footerFontWeight?: string;
                columnWidth?: number;
                rowHeight?: number;
                headerAlign?: 'left' | 'center' | 'right';
                bodyAlign?: 'left' | 'center' | 'right';
                footerAlign?: 'left' | 'center' | 'right';
                cellPaddingX?: number;
                showHeader?: boolean;
                showFooter?: boolean;
                showTotals?: boolean;
                zebraOddBg?: string;
                zebraEvenBg?: string;
                conditionalRules?: Array<{
                    op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                    value?: string | number;
                    valueTo?: string | number;
                    bg?: string;
                    color?: string;
                    targetFields?: string[];
                    targetZone?: 'header' | 'body' | 'footer' | 'total';
                    targetTreeLevel?: number;
                    contextContains?: string;
                    contextDateFrom?: string;
                    contextDateTo?: string;
                    logic?: 'AND' | 'OR';
                    conditions?: Array<{
                        op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
                        value?: string | number;
                        valueTo?: string | number;
                    }>;
                }>;
                columnStyles?: Record<
                    string,
                    {
                        width?: number;
                        bg?: string;
                        color?: string;
                        align?: 'left' | 'center' | 'right';
                        fontWeight?: string;
                        hide?: boolean;
                        pin?: boolean;
                        order?: number;
                        displayTitle?: string;
                    }
                >;
                columnFormats?: Record<string, 'integer' | 'percent1' | 'currency0'>;
                customNumberMasks?: Record<string, string>;
                locale?: string;
                currency?: string;
                suffix?: string;
                stylePriority?: Array<'preset' | 'zone' | 'rule' | 'column'>;
                densityProfile?: 'compact' | 'normal' | 'legacy-desktop';
                headerSkin?: 'default' | 'classic-blue' | 'flat-light';
                emptyCellPolicy?: 'blank' | 'zero' | 'dash';
                thresholdPack?: 'none' | 'zpk-traffic' | 'kpi-soft';
                semanticSlots?: Record<string, string>;
                semanticSlotStyles?: Record<
                    string,
                    {
                        bg?: string;
                        color?: string;
                        fontWeight?: string;
                        align?: 'left' | 'center' | 'right';
                    }
                >;
                viewModePresets?: Array<{id: string; name: string; settings: Record<string, unknown>}>;
                priority?: Array<'header' | 'body' | 'footer'>;
            };
            dashboardTheme?: {
                id?: string;
                table?: Record<string, unknown>;
                pie?: Record<string, unknown>;
            };
            inheritDashboardTheme?: boolean;
            schemaVersion?: number;
            policy?: {
                canEditTheme?: boolean;
                canPublishRegistry?: boolean;
                canEditGlobalPresets?: boolean;
                lockedPresetIds?: string[];
            };
            themeRegistry?: Array<{
                id: string;
                name: string;
                createdAt: string;
                theme: Record<string, unknown>;
            }>;
            presetCatalog?: Array<{
                id: string;
                name: string;
                createdAt: string;
                status: 'draft' | 'pending' | 'approved' | 'rejected';
                locked?: boolean;
                approvalComment?: string;
                preset: Record<string, unknown>;
            }>;
            profileHistory?: Array<{
                id: string;
                name: string;
                createdAt: string;
                customization: Record<string, unknown>;
            }>;
        };
    };
} & MetricFontSettings;

export type V14NavigatorSettings = {
    navigatorMode: string;
    isNavigatorAvailable: boolean;
    selectedLines: string[];
    linesMode: string;
    periodSettings: {
        type: string;
        value: string;
        period: string;
    };
};

export type V14Filter = {
    guid: string;
    datasetId: string;
    disabled?: string;
    filter: {
        operation: {
            code: string;
        };
        value?: string | string[];
    };
    type: string;
    title: string;
    calc_mode: DatasetFieldCalcMode;
} & V14ClientOnlyFields;

export type V14Sort = {
    guid: string;
    title: string;
    source?: string;
    datasetId: string;
    direction: string;
    data_type: string;
    format?: string;
    type: string;
    default_value?: ParameterDefaultValue;
} & V14ClientOnlyFields;

export type V14Link = {
    id: string;
    fields: Record<string, V14LinkField>;
};

export type V14LinkField = {
    field: {
        title: string;
        guid: string;
    };
    dataset: {
        id: string;
        realName: string;
    };
};

export type V14Visualization = {
    id: string;
    highchartsId?: string;
    selectedLayerId?: string;
    layers?: V14Layer[];
    placeholders: V14Placeholder[];
};

export type V14LayerSettings = {
    id: string;
    name: string;
    type: string;
    alpha: number;
    valid: boolean;
};

export type V14CommonPlaceholders = {
    colors: V14Color[];
    labels: V14Label[];
    tooltips: V14Tooltip[];
    filters: V14Filter[];
    sort: V14Sort[];
    shapes?: V14Shape[];
    colorsConfig?: V14ColorsConfig;
    geopointsConfig?: V14PointSizeConfig;
    shapesConfig?: V14ShapesConfig;
    tooltipConfig?: V14TooltipConfig;
};

export type V14Layer = {
    id: string;
    commonPlaceholders: V14CommonPlaceholders;
    layerSettings: V14LayerSettings;
    placeholders: V14Placeholder[];
};

export type V14PlaceholderSettings = {
    groupping?: 'disabled' | 'off';
    autoscale?: boolean;
    scale?: 'auto' | 'manual';
    scaleValue?: '0-max' | [string, string];
    title?: 'auto' | 'manual' | 'off';
    titleValue?: 'string';
    type?: 'logarithmic';
    grid?: 'on' | 'off';
    gridStep?: 'manual';
    gridStepValue?: number;
    hideLabels?: 'yes' | 'no';
    labelsView?: 'horizontal' | 'vertical' | 'angle';
    nulls?: AxisNullsMode;
    holidays?: 'on' | 'off';
    axisLabelFormating?: V14Formatting;
    axisLabelDateFormat?: string;
    axisFormatMode?: AxisLabelFormatMode;
    axisModeMap?: Record<string, AxisMode>;
    disableAxisMode?: boolean;
    /* Whether axis, including axis title, line, ticks and labels, should be visible
     * @default 'show'
     **/
    axisVisibility?: 'show' | 'hide';
    /* Direction of the axis: normal or reversed
     * @default 'asc'
     **/
    axisOrder?: 'asc' | 'desc';
};

export type V14Placeholder = {
    id: string;
    settings?: V14PlaceholderSettings;
    required?: boolean;
    capacity?: number;
    items: V14Field[];
};

export type V14Color = {
    datasetId: string;
    guid: string;
    title: string;
    type: string;
    data_type: string;
    formatting?: V14Formatting;
    calc_mode: DatasetFieldCalcMode;
} & V14ClientOnlyFields;

export type V14Shape = {
    datasetId: string;
    guid: string;
    title: string;
    originalTitle?: string;
    type: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V14ClientOnlyFields;

export type V14Tooltip = {
    datasetId: string;
    guid: string;
    title: string;
    formatting?: V14Formatting;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
} & V14ClientOnlyFields;

export type V14Formatting = {
    format?: NumberFormatType;
    showRankDelimiter?: boolean;
    prefix?: string;
    postfix?: string;
    unit?: NumberFormatUnit;
    precision?: number;
    labelMode?: string;
};

export type V14Label = {
    datasetId: string;
    type: string;
    title: string;
    guid: string;
    formatting?: V14Formatting;
    format?: string;
    data_type: string;
    calc_mode: DatasetFieldCalcMode;
};

export type V14HierarchyField = {
    data_type: string;
    fields: V14Field[];
    type: string;
};

export type V14PointSizeConfig = {
    radius: number;
    minRadius: number;
    maxRadius: number;
};

export type V14Field = {
    data_type: string;
    fields?: V14Field[];
    type: string;
    title: string;
    guid: string;
    formatting?: V14Formatting;
    format?: string;
    datasetId: string;
    source?: string;
    datasetName?: string;
    hideLabelMode?: string;
    calc_mode: DatasetFieldCalcMode;
    default_value?: ParameterDefaultValue;
    barsSettings?: TableBarsSettings;
    subTotalsSettings?: TableSubTotalsSettings;
    backgroundSettings?: TableFieldBackgroundSettings;
    columnSettings?: ColumnSettings;
    hintSettings?: HintSettings;
    ui_settings?: string;
} & V14ClientOnlyFields;

export type V14ColorsConfig = {
    thresholdsMode?: string;
    leftThreshold?: string;
    middleThreshold?: string;
    rightThreshold?: string;
    gradientPalette?: string;
    gradientMode?: string;
    polygonBorders?: string;
    reversed?: boolean;
    fieldGuid?: string;
    mountedColors?: Record<string, string>;
    coloredByMeasure?: boolean;
    palette?: string;
    colorMode?: ColorMode;
    nullMode?: GradientNullMode;
};

export type V14ShapesConfig = {
    mountedShapes?: Record<string, string>;
    fieldGuid?: string;
};

export type V14TooltipConfig = {
    color?: 'on' | 'off';
    fieldTitle?: 'on' | 'off';
};

export type V14ChartsConfigDatasetField = {
    guid: string;
    title: string;
    calc_mode?: DatasetFieldCalcMode;
};

export type V14ClientOnlyFields = {
    fakeTitle?: string;
    originalTitle?: string;
    markupType?: MarkupType;
};
