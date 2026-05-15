import React from 'react';

import type {Highcharts} from '@gravity-ui/chartkit/highcharts';
import {Dialog, Loader, SegmentedRadioGroup as RadioButton, Select} from '@gravity-ui/uikit';
import block from 'bem-cn-lite';
import {i18n} from 'i18n';
import _isEqual from 'lodash/isEqual';
import _pick from 'lodash/pick';
import {connect} from 'react-redux';
import type {
    CommonSharedExtraSettings,
    Dataset,
    MapCenterModes,
    NavigatorPeriod,
    NavigatorSettings,
    Period,
    PlaceholderSettings,
    QLChartType,
    Shared,
    WidgetSizeType,
    ZoomModes,
} from 'shared';
import {
    ChartSettingsDialogQA,
    DASHBOARD_VISUALIZATION_PROFILE_OPTIONS,
    DEFAULT_WIDGET_SIZE,
    Feature,
    IndicatorTitleMode,
    MapCenterMode,
    NavigatorLinesMode,
    PlaceholderId,
    WidgetSize,
    WizardVisualizationId,
    ZoomMode,
    getIsNavigatorAvailable,
    resolveVisualizationCustomizationProfile,
    isDateField,
    isTreeField,
} from 'shared';
import type {DatalensGlobalState} from 'ui';
import {getFirstFieldInPlaceholder} from 'ui/units/wizard/utils/placeholder';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';
import type {WidgetData} from 'units/wizard/actions/widget';
import {selectHighchartsWidget, selectIsLoading} from 'units/wizard/selectors/preview';

import DialogManager from '../../../../../components/DialogManager/DialogManager';
import ColorPickerInput from '../../../../../components/ColorPickerInput/ColorPickerInput';
import {RangeInputPicker} from '../../../../../components/common/RangeInputPicker';
import {DEFAULT_PAGE_ROWS_LIMIT} from '../../../../../constants/misc';
import {getQlAutoExecuteChartValue} from '../../../../ql/utils/chart-settings';
import {CHART_SETTINGS, SETTINGS, VISUALIZATION_IDS} from '../../../constants';
import {getDefaultChartName} from '../../../utils/helpers';
import {omitPivotOnlyExtraSettings} from '../../../utils/wizard';
import {
    VisualizationCustomizationProfile,
    getVisualizationCustomizationBehaviorFlags,
} from 'shared/modules/wizard/customization-profile';

import {CenterSetting} from './CenterSetting/CenterSetting';
import IndicatorTitleSetting from './IndicatorTitleSetting/IndicatorTitleSetting';
import LimitInput from './LimitInput/LimitInput';
import SettingFeed from './SettingFeed/SettingFeed';
import SettingNavigator from './SettingNavigator/SettingNavigator';
import SettingPagination from './SettingPagination/SettingPagination';
import SettingSwitcher from './SettingSwitcher/SettingSwitcher';
import SettingTitleMode from './SettingTitleMode/SettingTitleMode';
import {ZoomSetting} from './ZoomSetting/ZoomSetting';

import './Settings.scss';

const b = block('wizard-chart-settings');
type SettingsKeys = keyof State;

const BASE_SETTINGS_KEYS: SettingsKeys[] = [
    'titleMode',
    'indicatorTitleMode',
    'title',
    'legendMode',
    'tooltip',
    'tooltipSum',
    'pagination',
    'limit',
    'totals',
    'feed',
    'pivotFallback',
    'navigatorSettings',
    'pivotInlineSort',
    'size',
    'stacking',
    'zoomMode',
    'zoomValue',
    'mapCenterMode',
    'mapCenterValue',
    'preserveWhiteSpace',
];

const QL_SETTINGS_KEYS: SettingsKeys[] = [...BASE_SETTINGS_KEYS, 'qlAutoExecuteChart'];

const VISUALIZATION_WITH_TOOLTIP_AVAILABLE = new Set<string>([
    WizardVisualizationId.Line,
    WizardVisualizationId.LineD3,
    WizardVisualizationId.Area,
    WizardVisualizationId.Area100p,
    WizardVisualizationId.Column,
    WizardVisualizationId.Column100p,
    WizardVisualizationId.Bar,
    WizardVisualizationId.Bar100p,
    WizardVisualizationId.Scatter,
    WizardVisualizationId.Treemap,
    WizardVisualizationId.Pie,
    WizardVisualizationId.Donut,
    WizardVisualizationId.CombinedChart,
]);

const TOOLTIP_SUM_SUPPORTED_VISUALIZATION = new Set([
    'line',
    'line-d3',
    'area',
    'area100p',
    'column',
    'column100p',
    'bar',
    'bar100p',
]);

const DEFAULT_PERIOD: Period = 'day';

const visualizationsWithLegendDict = (
    [
        VISUALIZATION_IDS.LINE,
        WizardVisualizationId.LineD3,

        VISUALIZATION_IDS.AREA,
        VISUALIZATION_IDS.AREA_100P,

        VISUALIZATION_IDS.COLUMN,
        VISUALIZATION_IDS.COLUMN_100P,

        VISUALIZATION_IDS.BAR,
        VISUALIZATION_IDS.BAR_100P,

        VISUALIZATION_IDS.PIE,
        VISUALIZATION_IDS.DONUT,
        VISUALIZATION_IDS.SCATTER,

        VISUALIZATION_IDS.GEOLAYER,
        VISUALIZATION_IDS.GEOPOINT,
        VISUALIZATION_IDS.GEOPOLYGON,
        VISUALIZATION_IDS.HEATMAP,
        VISUALIZATION_IDS.COMBINED_CHART,

        VISUALIZATION_IDS.POLYLINE,

        VISUALIZATION_IDS.SCATTER_D3,
        VISUALIZATION_IDS.PIE_D3,
        VISUALIZATION_IDS.BAR_X_D3,
        WizardVisualizationId.DonutD3,
        WizardVisualizationId.BarYD3,
        WizardVisualizationId.BarY100pD3,
    ] as string[]
).reduce((acc: Record<string, boolean>, item) => {
    acc[item] = true;
    return acc;
}, {});

type StateProps = ReturnType<typeof mapStateToProps>;

interface GeneralProps {
    onApply: (args: {
        visualization: Shared['visualization'];
        extraSettings: CommonSharedExtraSettings;
        isSettingsEqual: boolean;
        qlMode?: boolean;
    }) => void;
    onCancel: () => void;
    dataset?: Dataset;
    visualization: Shared['visualization'];
    extraSettings: CommonSharedExtraSettings;
    widget: WidgetData;
    datasetsCount: number;
    qlMode?: boolean;
    chartType: QLChartType | null | undefined;
}

type InnerProps = GeneralProps & StateProps;

interface State {
    valid: boolean;
    titleMode: string;
    indicatorTitleMode: IndicatorTitleMode;
    title: string;
    legendMode: string;
    tooltip?: CommonSharedExtraSettings['tooltip'];
    tooltipSum: string;
    feed: string;
    pagination?: string;
    limit?: string;
    groupping?: string;
    totals?: string;
    pivotFallback?: string;
    navigatorSettings: NavigatorSettings;
    navigatorSeries: string[];
    qlAutoExecuteChart?: string;
    isPivotTable: boolean;
    pivotInlineSort: string;
    stacking: string;
    size?: WidgetSizeType;
    zoomMode: ZoomModes;
    zoomValue?: number | null;
    mapCenterMode: MapCenterModes;
    mapCenterValue?: string | null;
    preserveWhiteSpace?: boolean;
    customizationProfileId?: string;
    customizationJson?: string;
    customizationError?: string;
    customizationDraft?: Record<string, any>;
    customizationTab?: 'general' | 'pie' | 'table';
    paletteTick?: number;
    paletteNameInput?: string;
    ruleOp?: 'gt' | 'lt' | 'eq' | 'between' | 'contains';
    ruleValue?: string;
    ruleValueTo?: string;
    ruleBg?: string;
    ruleColor?: string;
    selectedColumnIndex?: string;
    columnWidthInput?: number;
    columnBgInput?: string;
    columnColorInput?: string;
    columnAlignInput?: 'left' | 'center' | 'right';
    columnWeightInput?: string;
    selectedFieldIdForRule?: string;
    selectedFormatPreset?: 'none' | 'integer' | 'percent1' | 'currency0';
    inheritDashboardTheme?: boolean;
    historySnapshotName?: string;
    ruleTargetZone?: 'header' | 'body' | 'footer' | 'total';
    ruleTargetTreeLevel?: string;
    ruleContextContains?: string;
    ruleContextDateFrom?: string;
    ruleContextDateTo?: string;
    ruleLogic?: 'AND' | 'OR';
    ruleGroupJson?: string;
    themeRegistryName?: string;
    selectedThemeCompareId?: string;
    columnDisplayTitleInput?: string;
    columnOrderInput?: number;
    columnHideInput?: boolean;
    columnPinInput?: boolean;
    ruleGroupConditions?: Array<{op?: 'gt' | 'lt' | 'eq' | 'between' | 'contains'; value?: string; valueTo?: string}>;
    draggedRuleConditionIndex?: number;
    diffPage?: number;
    diffPageSize?: number;
    diffFilterPath?: string;
    diffFilterSource?: '' | 'rule' | 'zone' | 'column' | 'theme';
    catalogPresetName?: string;
    catalogApprovalComment?: string;
    isolateByWidget?: boolean;
    reuseGroupKey?: string;
    customizationDirty?: boolean;
    flatCellOvRow?: string;
    flatCellOvCol?: string;
    flatCellOvBg?: string;
    flatCellOvColor?: string;
    flatRowStyleIdx?: string;
    flatRowStyleBg?: string;
    flatRowStyleColor?: string;
}

const QUICK_REUSABLE_COLORS = [
    '#2B5BA8',
    '#4A7EC7',
    '#7F9FD3',
    '#9FB6DF',
    '#AEC3E7',
    '#B5C7E6',
    '#FFFFFF',
    '#000000',
    '#FF6347',
    '#FFFF00',
    '#92D050',
];
const TABLE_PALETTES_STORAGE_KEY = 'ydl-customization-table-palettes-v1';
const CUSTOMIZATION_SCHEMA_VERSION = 15;

function migrateCustomizationDraft(input: Record<string, any> | undefined) {
    const draft = {...(input || {})};
    const version = Number(draft.schemaVersion || 14);
    if (version < 15) {
        draft.policy = {
            canEditTheme: true,
            canPublishRegistry: true,
            canEditGlobalPresets: true,
            lockedPresetIds: [],
            ...(draft.policy || {}),
        };
        draft.profileHistory = Array.isArray(draft.profileHistory) ? draft.profileHistory : [];
        draft.themeRegistry = Array.isArray(draft.themeRegistry) ? draft.themeRegistry : [];
        draft.presetCatalog = Array.isArray(draft.presetCatalog) ? draft.presetCatalog : [];
    }
    draft.schemaVersion = CUSTOMIZATION_SCHEMA_VERSION;
    return draft;
}

export const DIALOG_CHART_SETTINGS = Symbol('DIALOG_CHART_SETTINGS');

export type OpenDialogChartSettingsArgs = {
    id: typeof DIALOG_CHART_SETTINGS;
    props: GeneralProps;
};

class DialogSettings extends React.PureComponent<InnerProps, State> {
    constructor(props: InnerProps) {
        super(props);

        const {widget, dataset, visualization, extraSettings} = this.props;

        let groupping;

        const isFlatTable = visualization.id === 'flatTable';
        const isPivotTable = visualization.id === 'pivotTable';
        const isDonut = [WizardVisualizationId.Donut, WizardVisualizationId.DonutD3].includes(
            visualization.id as WizardVisualizationId,
        );

        if (isFlatTable) {
            const placeholderWithGrouppingSettings = visualization.placeholders.find(
                (placeholder) =>
                    placeholder.settings && (placeholder.settings as {groupping: string}).groupping,
            )!;

            groupping = (placeholderWithGrouppingSettings.settings as {groupping: string})
                .groupping;
        }

        const {
            titleMode = CHART_SETTINGS.TITLE_MODE.HIDE,
            indicatorTitleMode = IndicatorTitleMode.ByField,
            title = (widget && widget.key && widget.key.replace(/.+\//, '')) ||
                getDefaultChartName({dataset, visualization}),
            legendMode = CHART_SETTINGS.LEGEND.SHOW,
            tooltipSum = CHART_SETTINGS.TOOLTIP_SUM.ON,
            pagination = CHART_SETTINGS.PAGINATION.OFF,
            totals = CHART_SETTINGS.TOTALS.OFF,
            limit = DEFAULT_PAGE_ROWS_LIMIT,
            feed = '',
            pivotFallback: pivotFallbackRaw = 'off',
            qlAutoExecuteChart,
            pivotInlineSort: pivotInlineSortRaw = CHART_SETTINGS.PIVOT_INLINE_SORT.ON,
            stacking = CHART_SETTINGS.STACKING.ON,
            tooltip,
            size,
            zoomMode = ZoomMode.Auto,
            zoomValue,
            mapCenterMode = MapCenterMode.Auto,
            mapCenterValue,
            preserveWhiteSpace,
            customization: rawCustomization,
        } = extraSettings;
        const customization = migrateCustomizationDraft(rawCustomization as any);
        const resolvedCustomizationProfileId = resolveVisualizationCustomizationProfile({
            extraSettings: extraSettings as Record<string, unknown>,
            titleHints: [title],
        });

        const pivotFallback = isFlatTable ? 'off' : pivotFallbackRaw;
        const pivotInlineSort = isFlatTable ? 'on' : pivotInlineSortRaw;

        const navigatorSettings = this.prepareNavigatorSettings(visualization, extraSettings);
        const navigatorSeries = this.prepareNavigatorSeries(navigatorSettings.isNavigatorAvailable);

        const filteredSelectedLines = (navigatorSettings.selectedLines || []).filter((line) =>
            navigatorSeries.includes(line),
        );

        const syncedNavigatorSettings: NavigatorSettings = {
            ...navigatorSettings,
            selectedLines: filteredSelectedLines,
        };

        const tableSettings: Partial<
            Record<
                keyof Pick<
                    State,
                    'pagination' | 'limit' | 'totals' | 'pivotFallback' | 'groupping'
                >,
                string | undefined
            >
        > = {};

        if (isPivotTable || isFlatTable) {
            tableSettings.totals = totals;

            if (isPivotTable) {
                tableSettings.pivotFallback = pivotFallback;
            }
            const isBackendPivotTable = pivotFallback !== 'on';
            if ((isPivotTable && isBackendPivotTable) || isFlatTable) {
                tableSettings.pagination = pagination;
                tableSettings.limit = String(limit);
            }

            if (isFlatTable) {
                tableSettings.groupping = groupping;
            }
        }

        this.state = {
            valid: true,
            isPivotTable,
            pivotInlineSort,
            titleMode,
            indicatorTitleMode,
            qlAutoExecuteChart: getQlAutoExecuteChartValue(qlAutoExecuteChart, props.chartType),
            title,
            legendMode,
            tooltipSum,
            feed,
            navigatorSettings: syncedNavigatorSettings,
            navigatorSeries,
            ...(isDonut && {totals}),
            ...tableSettings,
            tooltip,
            stacking,
            size,
            zoomMode,
            zoomValue,
            mapCenterMode,
            mapCenterValue,
            preserveWhiteSpace,
            customizationProfileId: resolvedCustomizationProfileId,
            customizationJson: customization ? JSON.stringify(customization, null, 2) : '',
            customizationError: '',
            customizationDraft: {
                pie: {
                    titleFontSize: (customization as any)?.pie?.titleFontSize ?? 18,
                    slicedOffset: (customization as any)?.pie?.slicedOffset ?? 16,
                    pointOffset: (customization as any)?.pie?.pointOffset ?? 14,
                    borderWidth: (customization as any)?.pie?.borderWidth ?? 0,
                    borderColor: (customization as any)?.pie?.borderColor ?? 'transparent',
                    legend: {
                        position: (customization as any)?.pie?.legend?.position ?? 'right',
                        itemDistance: (customization as any)?.pie?.legend?.itemDistance ?? 10,
                        symbolType: (customization as any)?.pie?.legend?.symbolType ?? 'rect',
                        symbolWidth: (customization as any)?.pie?.legend?.symbolWidth ?? 14,
                        symbolHeight: (customization as any)?.pie?.legend?.symbolHeight ?? 4,
                        symbolRadius: (customization as any)?.pie?.legend?.symbolRadius ?? 0,
                    },
                },
                table: {
                    flat: {
                        headerBg:
                            (customization as any)?.table?.flat?.headerBg ??
                            (customization as any)?.table?.headerBg ??
                            '#7f9fd3',
                        headerColor:
                            (customization as any)?.table?.flat?.headerColor ??
                            (customization as any)?.table?.headerColor ??
                            '#ffffff',
                        bodyBg:
                            (customization as any)?.table?.flat?.bodyBg ??
                            (customization as any)?.table?.bodyBg ??
                            '#aec3e7',
                        bodyColor:
                            (customization as any)?.table?.flat?.bodyColor ??
                            (customization as any)?.table?.bodyColor ??
                            '#1f3f73',
                        footerBg:
                            (customization as any)?.table?.flat?.footerBg ??
                            (customization as any)?.table?.footerBg ??
                            '#7f9fd3',
                        footerColor:
                            (customization as any)?.table?.flat?.footerColor ??
                            (customization as any)?.table?.footerColor ??
                            '#ffffff',
                        borderColor:
                            (customization as any)?.table?.flat?.borderColor ??
                            (customization as any)?.table?.borderColor ??
                            '#b5c7e6',
                        showHeader: (customization as any)?.table?.flat?.showHeader ?? true,
                        showFooter: (customization as any)?.table?.flat?.showFooter ?? true,
                        showTotals: (customization as any)?.table?.flat?.showTotals ?? true,
                        zebraOddBg: (customization as any)?.table?.flat?.zebraOddBg ?? '#f6f9ff',
                        zebraEvenBg: (customization as any)?.table?.flat?.zebraEvenBg ?? '#ffffff',
                        conditionalRules:
                            (customization as any)?.table?.flat?.conditionalRules ?? [],
                        columnStyles: (customization as any)?.table?.flat?.columnStyles ?? {},
                        columnFormats: (customization as any)?.table?.flat?.columnFormats ?? {},
                        densityProfile:
                            (customization as any)?.table?.flat?.densityProfile ?? 'legacy-desktop',
                        headerSkin: (customization as any)?.table?.flat?.headerSkin ?? 'classic-blue',
                        emptyCellPolicy:
                            (customization as any)?.table?.flat?.emptyCellPolicy ?? 'blank',
                        thresholdPack: (customization as any)?.table?.flat?.thresholdPack ?? 'none',
                        semanticSlots: (customization as any)?.table?.flat?.semanticSlots ?? {},
                        semanticSlotStyles:
                            (customization as any)?.table?.flat?.semanticSlotStyles ?? {},
                        viewModePresets: (customization as any)?.table?.flat?.viewModePresets ?? [],
                        priority:
                            (customization as any)?.table?.flat?.priority ??
                            (customization as any)?.table?.priority ??
                            ['header', 'body', 'footer'],
                    },
                    pivot: {
                        headerBg:
                            (customization as any)?.table?.pivot?.headerBg ??
                            (customization as any)?.table?.headerBg ??
                            '#7f9fd3',
                        headerColor:
                            (customization as any)?.table?.pivot?.headerColor ??
                            (customization as any)?.table?.headerColor ??
                            '#ffffff',
                        bodyBg:
                            (customization as any)?.table?.pivot?.bodyBg ??
                            (customization as any)?.table?.bodyBg ??
                            '#aec3e7',
                        bodyColor:
                            (customization as any)?.table?.pivot?.bodyColor ??
                            (customization as any)?.table?.bodyColor ??
                            '#1f3f73',
                        footerBg:
                            (customization as any)?.table?.pivot?.footerBg ??
                            (customization as any)?.table?.footerBg ??
                            '#7f9fd3',
                        footerColor:
                            (customization as any)?.table?.pivot?.footerColor ??
                            (customization as any)?.table?.footerColor ??
                            '#ffffff',
                        borderColor:
                            (customization as any)?.table?.pivot?.borderColor ??
                            (customization as any)?.table?.borderColor ??
                            '#b5c7e6',
                        showHeader: (customization as any)?.table?.pivot?.showHeader ?? true,
                        showFooter: (customization as any)?.table?.pivot?.showFooter ?? true,
                        showTotals: (customization as any)?.table?.pivot?.showTotals ?? true,
                        zebraOddBg: (customization as any)?.table?.pivot?.zebraOddBg ?? '#f6f9ff',
                        zebraEvenBg: (customization as any)?.table?.pivot?.zebraEvenBg ?? '#ffffff',
                        conditionalRules:
                            (customization as any)?.table?.pivot?.conditionalRules ?? [],
                        columnStyles: (customization as any)?.table?.pivot?.columnStyles ?? {},
                        columnFormats: (customization as any)?.table?.pivot?.columnFormats ?? {},
                        densityProfile:
                            (customization as any)?.table?.pivot?.densityProfile ?? 'legacy-desktop',
                        headerSkin: (customization as any)?.table?.pivot?.headerSkin ?? 'classic-blue',
                        emptyCellPolicy:
                            (customization as any)?.table?.pivot?.emptyCellPolicy ?? 'blank',
                        thresholdPack: (customization as any)?.table?.pivot?.thresholdPack ?? 'none',
                        semanticSlots: (customization as any)?.table?.pivot?.semanticSlots ?? {},
                        semanticSlotStyles:
                            (customization as any)?.table?.pivot?.semanticSlotStyles ?? {},
                        viewModePresets: (customization as any)?.table?.pivot?.viewModePresets ?? [],
                        priority:
                            (customization as any)?.table?.pivot?.priority ??
                            (customization as any)?.table?.priority ??
                            ['header', 'body', 'footer'],
                    },
                },
            },
            customizationTab: 'general',
            paletteTick: 0,
            paletteNameInput: '',
            ruleOp: 'gt',
            ruleValue: '',
            ruleValueTo: '',
            ruleBg: '#fff2a8',
            ruleColor: '#1f3f73',
            selectedColumnIndex: '0',
            columnWidthInput: 120,
            columnBgInput: '#ffffff',
            columnColorInput: '#1f3f73',
            columnAlignInput: 'center',
            columnWeightInput: '400',
            selectedFieldIdForRule: '',
            selectedFormatPreset: 'none',
            inheritDashboardTheme: Boolean((customization as any)?.inheritDashboardTheme),
            historySnapshotName: '',
            ruleTargetZone: 'body',
            ruleTargetTreeLevel: '',
            ruleContextContains: '',
            ruleContextDateFrom: '',
            ruleContextDateTo: '',
            ruleLogic: 'AND',
            ruleGroupJson: '',
            themeRegistryName: '',
            selectedThemeCompareId: '',
            columnDisplayTitleInput: '',
            columnOrderInput: 0,
            columnHideInput: false,
            columnPinInput: false,
            ruleGroupConditions: [],
            draggedRuleConditionIndex: undefined,
            diffPage: 1,
            diffPageSize: 10,
            diffFilterPath: '',
            diffFilterSource: '',
            catalogPresetName: '',
            catalogApprovalComment: '',
            isolateByWidget: Boolean((customization as any)?.isolateByWidget),
            reuseGroupKey: String((customization as any)?.reuseGroupKey || ''),
            customizationDirty: false,
            flatCellOvRow: '',
            flatCellOvCol: '',
            flatCellOvBg: '#fff3cd',
            flatCellOvColor: '#1f3f73',
            flatRowStyleIdx: '',
            flatRowStyleBg: '#e8f0fc',
            flatRowStyleColor: '',
        };
    }

    componentDidUpdate(prevProps: Readonly<InnerProps>) {
        if (
            typeof prevProps.highchartsWidget?.series === 'undefined' &&
            typeof this.props.highchartsWidget?.series !== 'undefined' &&
            this.state.navigatorSettings.isNavigatorAvailable
        ) {
            const navigatorSeries = this.prepareNavigatorSeries(
                this.state.navigatorSettings.isNavigatorAvailable,
            );

            const selectedLines = this.state.navigatorSettings.selectedLines || [];
            const filteredSelectedLines = selectedLines.filter((line) =>
                navigatorSeries.includes(line),
            );
            this.setState({
                navigatorSeries,
                navigatorSettings: {
                    ...this.state.navigatorSettings,
                    selectedLines: filteredSelectedLines,
                },
            });
        }
    }

    prepareNavigatorSeries(isNavigatorAvailable: boolean): string[] {
        if (!isNavigatorAvailable) {
            return [];
        }
        const highchartsWidget = this.props?.highchartsWidget;
        const userSeries = highchartsWidget?.userOptions?.series || [];
        const graphs = highchartsWidget?.series || [];

        const seriesNames = userSeries.map(
            (userSeria) => userSeria.legendTitle || userSeria.title || userSeria.name,
        );
        return graphs
            .filter((series: Highcharts.Series) => {
                const axisExtremes = series.yAxis.getExtremes();

                if (!series.data.length) {
                    return false;
                }

                if (axisExtremes.dataMin === null && axisExtremes.dataMax === null) {
                    return false;
                } else {
                    return seriesNames.includes(series.name);
                }
            })
            .map((series) => series.name);
    }

    prepareNavigatorSettings(
        visualization: Shared['visualization'],
        extraSettings: CommonSharedExtraSettings,
    ): NavigatorSettings {
        const isNavigatorAvailable = getIsNavigatorAvailable(visualization);

        if (!isNavigatorAvailable) {
            return {isNavigatorAvailable} as NavigatorSettings;
        }

        const navigatorSettings: NavigatorSettings =
            extraSettings.navigatorSettings || ({} as NavigatorSettings);

        const navigatorMode =
            navigatorSettings.navigatorMode ||
            // Fallback for old charts, the navigatorMode field was right in the settings
            extraSettings.navigatorMode ||
            CHART_SETTINGS.NAVIGATOR.HIDE;
        const navigatorSeriesName = extraSettings.navigatorSeriesName || '';

        const selectedLines: string[] = navigatorSettings.selectedLines || [];

        let periodSettings = navigatorSettings.periodSettings;
        let linesMode = navigatorSettings.linesMode || NavigatorLinesMode.All;

        // Fallback, previously the navigator displayed only one line
        // In order not to change the old charts with the navigator, by default we display only one line.
        if (navigatorSeriesName) {
            selectedLines.push(navigatorSeriesName);
            linesMode = NavigatorLinesMode.Selected;
        }

        const itemDataType = this.getXPlaceholderItemDataType();

        if (!periodSettings) {
            // If the user had the navigator turned on and the default period was not set.
            // Then we leave the period empty (that is, we keep the old behavior of the navigator)
            // If this is the first time the navigator is turned on, then we put down the normal default period.
            periodSettings =
                navigatorMode === CHART_SETTINGS.NAVIGATOR.SHOW
                    ? {value: '', period: DEFAULT_PERIOD, type: itemDataType}
                    : {value: '1', period: DEFAULT_PERIOD, type: itemDataType};
        } else {
            // Updating the data_type of the period settings;
            periodSettings.type = itemDataType;
        }

        return {
            navigatorMode,
            isNavigatorAvailable,
            selectedLines,
            linesMode,
            periodSettings,
        };
    }

    setValid = (valid: boolean) => this.setState({valid});

    onApply = () => {
        let visualization = this.props.visualization;
        const baseKeys = this.props.qlMode ? QL_SETTINGS_KEYS : BASE_SETTINGS_KEYS;
        const keysForPick =
            visualization.id === 'flatTable'
                ? baseKeys.filter((k) => k !== 'pivotFallback' && k !== 'pivotInlineSort')
                : baseKeys;
        const settings = _pick(this.state, keysForPick);

        const prevForCompare =
            visualization.id === 'flatTable'
                ? omitPivotOnlyExtraSettings(this.props.extraSettings) ?? {}
                : this.props.extraSettings;
        const isSettingsEqual = _isEqual(settings, _pick(prevForCompare, keysForPick));

        let extraSettings: CommonSharedExtraSettings = {
            ...this.props.extraSettings,
            ...settings,
        } as CommonSharedExtraSettings;

        const profileId = (this.state.customizationProfileId || '').trim();
        if (profileId && profileId !== 'default') {
            (extraSettings as any).customizationProfileId = profileId;
        } else {
            delete (extraSettings as any).customizationProfileId;
        }
        const nextCustomization = migrateCustomizationDraft(
            this.state.customizationDraft as Record<string, any>,
        ) as Record<string, any>;
        nextCustomization.isolateByWidget = Boolean(this.state.isolateByWidget);
        nextCustomization.reuseGroupKey = String(this.state.reuseGroupKey || '').trim();
        nextCustomization.inheritDashboardTheme = Boolean(this.state.inheritDashboardTheme);
        if (this.state.inheritDashboardTheme && nextCustomization.dashboardTheme) {
            const theme = nextCustomization.dashboardTheme;
            if (theme.table) {
                nextCustomization.table = {
                    ...(theme.table as Record<string, unknown>),
                    ...(nextCustomization.table || {}),
                };
            }
            if (theme.pie) {
                nextCustomization.pie = {
                    ...(theme.pie as Record<string, unknown>),
                    ...(nextCustomization.pie || {}),
                };
            }
        }
        const hadCustomizationBefore = Boolean((this.props.extraSettings as any)?.customization);
        const shouldWriteCustomization =
            Boolean(this.state.customizationDirty) || hadCustomizationBefore;
        if (shouldWriteCustomization) {
            (extraSettings as any).customization = nextCustomization || undefined;
        } else {
            delete (extraSettings as any).customization;
        }

        if (visualization.id === 'flatTable') {
            extraSettings = omitPivotOnlyExtraSettings(extraSettings) ?? extraSettings;
        }

        // We give the limit type only before the submission in order to process the cases correctly
        // with an empty string, which when casted in Number will turn into 0
        if (extraSettings.limit) {
            extraSettings = {
                ...extraSettings,
                limit: Number(extraSettings.limit),
            };
        }

        if (visualization.id === 'flatTable') {
            visualization = {
                ...visualization,
                placeholders: visualization.placeholders.map((item) => {
                    if (item.settings?.groupping) {
                        return {
                            ...item,
                            settings: {
                                ...item.settings,
                                groupping: this.state.groupping,
                            },
                        };
                    }

                    return item;
                }),
            } as Shared['visualization'];
        }

        this.props.onApply({
            extraSettings,
            visualization,
            isSettingsEqual,
            qlMode: this.props.qlMode,
        });
    };

    handleNavigatorSelectedLineUpdate = (updatedSelectedLines: string[]) => {
        this.setState({
            navigatorSettings: {
                ...this.state.navigatorSettings,
                selectedLines: updatedSelectedLines,
            },
        });
    };

    handleNavigatorLineModeUpdate = (value: NavigatorLinesMode) => {
        this.setState({
            navigatorSettings: {...this.state.navigatorSettings, linesMode: value},
        });
    };

    handleNavigatorSwitcherChange = (value: string) => {
        this.setState({
            navigatorSettings: {...this.state.navigatorSettings, navigatorMode: value},
        });
    };

    handleNavigatorPeriodUpdate = (periodValues: NavigatorPeriod) => {
        this.setState({
            navigatorSettings: {...this.state.navigatorSettings, periodSettings: {...periodValues}},
        });
    };

    handleQlAutoExecuteChartUpdate = (value: string) => {
        this.setState({
            qlAutoExecuteChart: value,
        });
    };

    handlePivotInlineSortUpdate = (value: string) => {
        this.setState({
            pivotInlineSort: value,
        });
    };

    handleStackingUpdate = (value: string) => {
        this.setState({
            stacking: value,
        });
    };

    getXPlaceholderItemDataType() {
        const {visualization} = this.props;
        const placeholders = visualization.placeholders || [];
        const placeholderX = placeholders.find((placeholder) => placeholder.id === 'x');
        const items = placeholderX?.items || [];
        const item = items[0];

        return item.data_type;
    }

    renderTitleMode() {
        const {visualization} = this.props;
        if (visualization.id === WizardVisualizationId.Metric) {
            return (
                <IndicatorTitleSetting
                    mode={this.state.indicatorTitleMode}
                    title={this.state.title}
                    onUpdate={(settings) => {
                        this.setState({indicatorTitleMode: settings.mode, title: settings.title});
                    }}
                />
            );
        }

        const titleMode = this.state.titleMode || CHART_SETTINGS.TITLE_MODE.HIDE;
        const inputTitleValue = this.state.title;

        return (
            <SettingTitleMode
                titleMode={titleMode}
                inputValue={inputTitleValue}
                onChangeSwitcher={(value: string) => {
                    this.setState({titleMode: value});
                }}
                onChangeInput={(value: string) => {
                    this.setState({title: value});
                }}
            />
        );
    }

    renderWidgetSize() {
        const {visualization} = this.props;
        const isTableWidget = (
            [WizardVisualizationId.FlatTable, WizardVisualizationId.PivotTable] as string[]
        ).includes(visualization.id);

        if (!isTableWidget) {
            return null;
        }

        const sizes = [WidgetSize.S, WidgetSize.M, WidgetSize.L];
        const selected = this.state.size ?? DEFAULT_WIDGET_SIZE;

        return (
            <div className={b('widget-size')}>
                <span className={b('label')}>{i18n('wizard', 'label_widget-size')}</span>
                <RadioButton value={selected} onUpdate={(value) => this.setState({size: value})}>
                    {sizes.map((item) => (
                        <RadioButton.Option key={item} value={item}>
                            {item.toUpperCase()}
                        </RadioButton.Option>
                    ))}
                </RadioButton>
            </div>
        );
    }

    renderLegend() {
        const {legendMode = CHART_SETTINGS.LEGEND.SHOW} = this.state;

        const {visualization} = this.props;

        if (!visualizationsWithLegendDict[visualization.id]) {
            return null;
        }
        const title = i18n('wizard', 'label_legend');
        return (
            <SettingSwitcher
                currentValue={legendMode}
                checkedValue={CHART_SETTINGS.LEGEND.SHOW}
                uncheckedValue={CHART_SETTINGS.LEGEND.HIDE}
                onChange={(value) => {
                    this.setState({legendMode: value});
                }}
                title={title}
                qa="legend-switcher"
            />
        );
    }

    renderZoom() {
        const {zoomMode, zoomValue} = this.state;

        const {visualization} = this.props;

        if (visualization.id !== WizardVisualizationId.Geolayer) {
            return null;
        }

        return (
            <ZoomSetting
                mode={zoomMode}
                value={zoomValue}
                onUpdate={(settings) => {
                    this.setState({zoomMode: settings.mode, zoomValue: settings.value ?? null});
                }}
            />
        );
    }

    renderMapCenterSetting() {
        const {mapCenterMode, mapCenterValue} = this.state;

        const {visualization} = this.props;

        if (visualization.id !== WizardVisualizationId.Geolayer) {
            return null;
        }

        return (
            <CenterSetting
                mode={mapCenterMode}
                value={mapCenterValue}
                onUpdate={(settings) => {
                    this.setState({
                        mapCenterMode: settings.mode,
                        mapCenterValue: settings.value ?? null,
                    });
                }}
            />
        );
    }
    renderTooltip() {
        const {visualization} = this.props;

        if (!VISUALIZATION_WITH_TOOLTIP_AVAILABLE.has(visualization.id)) {
            return null;
        }

        const {tooltip = CHART_SETTINGS.TOOLTIP.SHOW} = this.state;
        return (
            <SettingSwitcher
                currentValue={tooltip}
                checkedValue={CHART_SETTINGS.TOOLTIP.SHOW}
                uncheckedValue={CHART_SETTINGS.TOOLTIP.HIDE}
                onChange={(value) => {
                    this.setState({tooltip: value as CommonSharedExtraSettings['tooltip']});
                }}
                title={i18n('wizard', 'label_tooltip')}
            />
        );
    }

    renderTooltipSum() {
        const {visualization} = this.props;
        const {tooltip, tooltipSum = CHART_SETTINGS.TOOLTIP_SUM.ON} = this.state;

        const tooltipSumEnabled = TOOLTIP_SUM_SUPPORTED_VISUALIZATION.has(visualization.id);

        if (!tooltipSumEnabled) {
            return null;
        }

        const title = i18n('wizard', 'label_tooltip-sum');

        return (
            <SettingSwitcher
                currentValue={tooltipSum}
                checkedValue={CHART_SETTINGS.TOOLTIP_SUM.ON}
                uncheckedValue={CHART_SETTINGS.TOOLTIP_SUM.OFF}
                onChange={(value: string) => {
                    this.setState({tooltipSum: value});
                }}
                title={title}
                qa="tooltip-sum-switcher"
                disabled={tooltip === CHART_SETTINGS.TOOLTIP.HIDE}
            />
        );
    }

    renderNavigator() {
        const {navigatorSettings, navigatorSeries} = this.state;
        const {navigatorMode, isNavigatorAvailable, periodSettings, linesMode, selectedLines} =
            navigatorSettings;

        if (!(navigatorSeries || []).length || !isNavigatorAvailable) {
            return null;
        }

        return (
            <SettingNavigator
                lines={navigatorSeries}
                periodSettings={periodSettings}
                onUpdatePeriod={this.handleNavigatorPeriodUpdate}
                selectedLines={selectedLines}
                onUpdateSelectedLines={this.handleNavigatorSelectedLineUpdate}
                linesMode={linesMode}
                onUpdateRadioButtons={this.handleNavigatorLineModeUpdate}
                navigatorValue={navigatorMode}
                onToggle={this.handleNavigatorSwitcherChange}
            />
        );
    }

    renderPagination() {
        const {datasetsCount} = this.props;
        const {pagination} = this.state;

        if (!pagination || this.props.qlMode) {
            return null;
        }

        const isTreeInTable = this.getIsTreeInTable();

        return (
            <SettingPagination
                paginationValue={pagination}
                onChange={(value: string) => {
                    this.setState({pagination: value});
                }}
                datasetsCount={datasetsCount}
                tooltipClassName={b('tooltip')}
                isTreeInTable={isTreeInTable}
            />
        );
    }

    renderLimit() {
        const {pagination, limit} = this.state;

        if (typeof limit === 'undefined' || this.props.qlMode) {
            return null;
        }

        return (
            <LimitInput
                text={limit}
                disabled={pagination === CHART_SETTINGS.PAGINATION.OFF}
                setValid={this.setValid}
                onChange={(nextLimit) => this.setState({limit: nextLimit})}
            />
        );
    }

    getGrouping() {
        const {groupping = CHART_SETTINGS.GROUPPING.ON} = this.state;

        /* Initially, this setting was set as {grouping: 'enabled'}, then it was renamed to 'on'|'off'. For the RadioButton component, this transition turned out to be quite painful, because it crashes when trying to drop a value into it that does not correspond to any value in RadioButton.Radio*/

        if (groupping === 'enabled') {
            return CHART_SETTINGS.GROUPPING.ON;
        }

        if (groupping === 'disabled') {
            return CHART_SETTINGS.GROUPPING.OFF;
        }

        return groupping;
    }

    renderGrouping() {
        const {groupping} = this.state;

        if (typeof groupping === 'undefined' || this.props.qlMode) {
            return null;
        }

        const title = i18n('wizard', 'label_groupping');
        return (
            <SettingSwitcher
                currentValue={this.getGrouping()}
                checkedValue={CHART_SETTINGS.GROUPPING.ON}
                uncheckedValue={CHART_SETTINGS.GROUPPING.OFF}
                onChange={(value: string) => {
                    this.setState({groupping: value});
                }}
                title={title}
                qa="groupping-switcher"
            />
        );
    }

    getIsTreeInTable() {
        const {visualization} = this.props;

        return (
            visualization.id === 'flatTable' &&
            visualization.placeholders.some((placeholder) => {
                return placeholder.items.some((field) => {
                    return isTreeField(field);
                });
            })
        );
    }

    renderTotals() {
        const {visualization, qlMode} = this.props;
        const {totals, pivotFallback} = this.state;
        const visualizationId = visualization.id as WizardVisualizationId;

        const shouldRenderTotal = [
            WizardVisualizationId.FlatTable,
            WizardVisualizationId.Donut,
            WizardVisualizationId.DonutD3,
        ].includes(visualizationId);

        if (!shouldRenderTotal || qlMode) {
            return null;
        }

        const isTreeInTable = this.getIsTreeInTable();
        const isPivotFallbackTurnedOn =
            visualizationId === WizardVisualizationId.PivotTable && pivotFallback === 'on';

        const currentValue = isPivotFallbackTurnedOn ? CHART_SETTINGS.TOTALS.OFF : totals || '';

        const title = i18n('wizard', 'label_totals');
        return (
            <SettingSwitcher
                currentValue={currentValue}
                checkedValue={CHART_SETTINGS.TOTALS.ON}
                uncheckedValue={CHART_SETTINGS.TOTALS.OFF}
                onChange={(value: string) => {
                    this.setState({totals: value});
                }}
                title={title}
                qa="totals-switcher"
                disabled={isTreeInTable || isPivotFallbackTurnedOn}
                tooltip={isTreeInTable}
                tooltipText={i18n('wizard', 'tooltip_tree-total_unavailable')}
                tooltipClassName={b('tooltip')}
                tooltipPosition={['right']}
            />
        );
    }

    renderTableWhiteSpace() {
        const {visualization} = this.props;
        const {preserveWhiteSpace} = this.state;
        const visualizationId = visualization.id as WizardVisualizationId;

        const isSettingAvailable = [
            WizardVisualizationId.FlatTable,
            WizardVisualizationId.PivotTable,
        ].includes(visualizationId);

        if (!isSettingAvailable) {
            return null;
        }

        return (
            <SettingSwitcher
                currentValue={preserveWhiteSpace ? 'on' : 'off'}
                checkedValue={'on'}
                uncheckedValue={'off'}
                onChange={(value: string) => {
                    this.setState({preserveWhiteSpace: value === 'on'});
                }}
                title={i18n('wizard', 'label_preserve-whitespace')}
                qa={ChartSettingsDialogQA.PreserveWhiteSpace}
            />
        );
    }

    renderLoader() {
        return (
            <div className={b('loader')}>
                <Loader size="l" />
            </div>
        );
    }

    renderFeed() {
        const visualization = this.props.visualization;
        const placeholders = [
            ...('layers' in visualization
                ? visualization.layers?.map((l) => l.placeholders).flat() ?? []
                : []),
            ...visualization.placeholders,
        ];

        const isInvertedXYAxis =
            visualization.id === WizardVisualizationId.Bar ||
            visualization.id === WizardVisualizationId.Bar100p;

        const placeholderIdWithDimensionField = isInvertedXYAxis
            ? PlaceholderId.Y
            : PlaceholderId.X;

        const placeholderWithDimensionField = placeholders.find(
            (p) => p.id === placeholderIdWithDimensionField,
        );

        if (
            !placeholderWithDimensionField ||
            ('allowComments' in visualization && visualization.allowComments === false)
        ) {
            return null;
        }

        const firstField = getFirstFieldInPlaceholder(placeholderWithDimensionField);
        const placeholderSettings = placeholderWithDimensionField.settings as PlaceholderSettings;
        const isValidField = Boolean(
            isDateField(firstField) &&
                placeholderSettings?.axisModeMap &&
                placeholderSettings?.axisModeMap[firstField.guid] &&
                placeholderSettings?.axisModeMap[firstField.guid] !== SETTINGS.AXIS_MODE.DISCRETE,
        );

        if (!isValidField || !isEnabledFeature(Feature.Comments)) {
            return null;
        }

        return (
            <SettingFeed
                currentFeed={this.state.feed}
                onFeedUpdate={(value: string) => {
                    this.setState({feed: value});
                }}
            />
        );
    }

    renderPivotFallback() {
        const {visualization} = this.props;
        const {pivotFallback} = this.state;

        if (visualization.id !== 'pivotTable') {
            return null;
        }

        const isMultiDataset = this.props.datasetsCount > 1;

        return (
            <SettingSwitcher
                currentValue={pivotFallback!}
                checkedValue={CHART_SETTINGS.PIVOT_FALLBACK.ON}
                uncheckedValue={CHART_SETTINGS.PIVOT_FALLBACK.OFF}
                onChange={(value) => {
                    const partialSettings: Pick<State, 'pivotFallback' | 'pagination' | 'limit'> = {
                        pivotFallback: value,
                    };

                    if (value === CHART_SETTINGS.PIVOT_FALLBACK.ON) {
                        partialSettings.pagination = undefined;
                        partialSettings.limit = undefined;
                    }

                    this.setState(partialSettings);
                }}
                title={i18n('wizard', 'label_pivot-fallback')}
                qa="pivot-fallback-switcher"
                disabled={isMultiDataset}
                tooltip={isMultiDataset}
                tooltipText={i18n('wizard', 'tooltip_backend-pivot_unavailable')}
                tooltipClassName={b('tooltip')}
                tooltipPosition={['right']}
            />
        );
    }

    renderQlAutoExecutionChart() {
        const {qlMode} = this.props;

        if (!qlMode || !this.state.qlAutoExecuteChart) {
            return null;
        }

        return (
            <SettingSwitcher
                currentValue={this.state.qlAutoExecuteChart}
                checkedValue={CHART_SETTINGS.QL_AUTO_EXECUTION_CHART.ON}
                uncheckedValue={CHART_SETTINGS.QL_AUTO_EXECUTION_CHART.OFF}
                onChange={this.handleQlAutoExecuteChartUpdate}
                title={i18n('sql', 'label_ql-auto-execution-chart')}
            />
        );
    }

    renderInlineSortSwitch() {
        const {isPivotTable, pivotInlineSort, pivotFallback} = this.state;

        if (!isPivotTable || pivotFallback === 'on') {
            return null;
        }

        return (
            <SettingSwitcher
                currentValue={pivotInlineSort}
                checkedValue={CHART_SETTINGS.PIVOT_INLINE_SORT.ON}
                uncheckedValue={CHART_SETTINGS.PIVOT_INLINE_SORT.OFF}
                onChange={this.handlePivotInlineSortUpdate}
                title={i18n('wizard', 'label_pivot-inline-sort')}
            />
        );
    }

    renderStackingSwitch() {
        const {visualization} = this.props;

        if (visualization.id !== VISUALIZATION_IDS.AREA) {
            return null;
        }

        const {stacking} = this.state;

        return (
            <SettingSwitcher
                currentValue={stacking}
                checkedValue={CHART_SETTINGS.STACKING.ON}
                uncheckedValue={CHART_SETTINGS.STACKING.OFF}
                onChange={this.handleStackingUpdate}
                title={i18n('wizard', 'label_stacking')}
            />
        );
    }

    renderCustomizationMvp() {
        const {
            customizationProfileId,
            customizationDraft,
            customizationError,
            paletteNameInput = '',
            ruleOp = 'gt',
            ruleValue = '',
            ruleValueTo = '',
            ruleBg = '#fff2a8',
            ruleColor = '#1f3f73',
            selectedColumnIndex = '0',
            columnWidthInput = 120,
            columnBgInput = '#ffffff',
            columnColorInput = '#1f3f73',
            columnAlignInput = 'center',
            columnWeightInput = '400',
            selectedFieldIdForRule = '',
            selectedFormatPreset = 'none',
            inheritDashboardTheme = false,
            historySnapshotName = '',
            ruleTargetZone = 'body',
            ruleTargetTreeLevel = '',
            ruleContextContains = '',
            ruleContextDateFrom = '',
            ruleContextDateTo = '',
            ruleLogic = 'AND',
            themeRegistryName = '',
            selectedThemeCompareId = '',
            columnDisplayTitleInput = '',
            columnOrderInput = 0,
            columnHideInput = false,
            columnPinInput = false,
            ruleGroupConditions = [],
            diffPage = 1,
            diffPageSize = 10,
            diffFilterPath = '',
            diffFilterSource = '',
            catalogPresetName = '',
            catalogApprovalComment = '',
            isolateByWidget = false,
            reuseGroupKey = '',
            flatCellOvRow = '',
            flatCellOvCol = '',
            flatCellOvBg = '#fff3cd',
            flatCellOvColor = '#1f3f73',
            flatRowStyleIdx = '',
            flatRowStyleBg = '#e8f0fc',
            flatRowStyleColor = '',
        } = this.state;
        const customizationTab = this.state.customizationTab || 'general';
        const showAdvancedCustomizationUi = false;
        const visualizationId = String(this.props.visualization.id || '');
        const isPieLike =
            visualizationId === 'pie' ||
            visualizationId === 'pie-d3' ||
            visualizationId === 'donut' ||
            visualizationId === 'donut-d3';
        const pieProfileUsesDistributionPreset = getVisualizationCustomizationBehaviorFlags(
            customizationProfileId || VisualizationCustomizationProfile.Default,
        ).enablePieDistributionPreset;
        const showPieManualLegendControls = isPieLike && !pieProfileUsesDistributionPreset;
        const isPivotTable = visualizationId === 'pivotTable';
        const isFlatTable = visualizationId === 'flatTable';
        const pie = customizationDraft?.pie || {};
        const pieLegend = pie.legend || {};
        const tableRoot = customizationDraft?.table || {};
        const table = isPivotTable
            ? tableRoot.pivot || {}
            : isFlatTable
              ? tableRoot.flat || {}
              : {};
        const setPie = (patch: Record<string, any>) =>
            this.setState({
                customizationDirty: true,
                customizationDraft: {
                    ...(customizationDraft || {}),
                    pie: {...pie, ...patch},
                },
            });
        const setPieLegend = (patch: Record<string, any>) =>
            this.setState({
                customizationDirty: true,
                customizationDraft: {
                    ...(customizationDraft || {}),
                    pie: {...pie, legend: {...pieLegend, ...patch}},
                },
            });
        const setTable = (patch: Record<string, any>) =>
            this.setState({
                customizationDirty: true,
                customizationDraft: {
                    ...(customizationDraft || {}),
                    table: {
                        ...tableRoot,
                        ...(isPivotTable ? {pivot: {...table, ...patch}} : {}),
                        ...(isFlatTable ? {flat: {...table, ...patch}} : {}),
                    },
                },
            });
        const loadSavedPalettes = (): Array<{name: string; table: Record<string, any>}> => {
            try {
                const raw = window.localStorage.getItem(TABLE_PALETTES_STORAGE_KEY);
                if (!raw) {
                    return [];
                }
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };
        const savePalettes = (palettes: Array<{name: string; table: Record<string, any>}>) => {
            window.localStorage.setItem(TABLE_PALETTES_STORAGE_KEY, JSON.stringify(palettes));
            this.setState((prev) => ({paletteTick: (prev.paletteTick || 0) + 1}));
        };
        const savedPalettes = loadSavedPalettes();
        const historyStorageKey = 'ydl-customization-history-v1';
        const themeRegistryStorageKey = 'ydl-customization-theme-registry-v1';
        const loadHistory = (): Array<{id: string; name: string; createdAt: string; customization: Record<string, unknown>}> => {
            const backendItems = Array.isArray((customizationDraft as any)?.profileHistory)
                ? ((customizationDraft as any).profileHistory as Array<{
                      id: string;
                      name: string;
                      createdAt: string;
                      customization: Record<string, unknown>;
                  }>)
                : [];
            try {
                const raw = window.localStorage.getItem(historyStorageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                const localItems = Array.isArray(parsed) ? parsed : [];
                return [...backendItems, ...localItems].slice(0, 50);
            } catch {
                return backendItems;
            }
        };
        const saveHistory = (
            items: Array<{id: string; name: string; createdAt: string; customization: Record<string, unknown>}>,
        ) => {
            window.localStorage.setItem(historyStorageKey, JSON.stringify(items));
            this.setState((prev) => ({
                paletteTick: (prev.paletteTick || 0) + 1,
                customizationDraft: {
                    ...(prev.customizationDraft || {}),
                    profileHistory: items,
                },
            }));
        };
        const historyItems = loadHistory();
        const loadThemeRegistry = (): Array<{
            id: string;
            name: string;
            createdAt: string;
            theme: Record<string, unknown>;
        }> => {
            const backendItems = Array.isArray((customizationDraft as any)?.themeRegistry)
                ? ((customizationDraft as any).themeRegistry as Array<{
                      id: string;
                      name: string;
                      createdAt: string;
                      theme: Record<string, unknown>;
                  }>)
                : [];
            try {
                const raw = window.localStorage.getItem(themeRegistryStorageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                const localItems = Array.isArray(parsed) ? parsed : [];
                return [...backendItems, ...localItems].slice(0, 100);
            } catch {
                return backendItems;
            }
        };
        const saveThemeRegistry = (
            items: Array<{id: string; name: string; createdAt: string; theme: Record<string, unknown>}>,
        ) => {
            window.localStorage.setItem(themeRegistryStorageKey, JSON.stringify(items));
            this.setState((prev) => ({
                paletteTick: (prev.paletteTick || 0) + 1,
                customizationDraft: {
                    ...(prev.customizationDraft || {}),
                    themeRegistry: items,
                },
            }));
        };
        const themeRegistry = loadThemeRegistry();
        const selectedThemeForDiff = themeRegistry.find((x) => x.id === selectedThemeCompareId);
        const getDiffCount = (a: unknown, b: unknown): number => {
            if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
                return JSON.stringify(a) === JSON.stringify(b) ? 0 : 1;
            }
            const ak = Object.keys(a as Record<string, unknown>);
            const bk = Object.keys(b as Record<string, unknown>);
            const all = Array.from(new Set([...ak, ...bk]));
            return all.reduce(
                (sum, key) =>
                    sum +
                    getDiffCount(
                        (a as Record<string, unknown>)[key],
                        (b as Record<string, unknown>)[key],
                    ),
                0,
            );
        };
        const themeDiffCount = selectedThemeForDiff
            ? getDiffCount(customizationDraft || {}, selectedThemeForDiff.theme)
            : 0;
        const getDiffEntries = (
            a: unknown,
            b: unknown,
            prefix = '',
            out: Array<{path: string; oldValue: string; newValue: string; source: string}> = [],
        ) => {
            if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
                if (JSON.stringify(a) !== JSON.stringify(b)) {
                    const source = prefix.includes('.column')
                        ? 'column'
                        : prefix.includes('.conditionalRules')
                          ? 'rule'
                          : prefix.includes('.table') || prefix.includes('.pie')
                            ? 'zone'
                            : 'theme';
                    out.push({
                        path: prefix || '$',
                        oldValue: JSON.stringify(a),
                        newValue: JSON.stringify(b),
                        source,
                    });
                }
                return out;
            }
            const keys = Array.from(
                new Set([
                    ...Object.keys(a as Record<string, unknown>),
                    ...Object.keys(b as Record<string, unknown>),
                ]),
            );
            keys.forEach((key) =>
                getDiffEntries(
                    (a as Record<string, unknown>)[key],
                    (b as Record<string, unknown>)[key],
                    prefix ? `${prefix}.${key}` : key,
                    out,
                ),
            );
            return out;
        };
        const themeDiffEntriesRaw = selectedThemeForDiff
            ? getDiffEntries(customizationDraft || {}, selectedThemeForDiff.theme).slice(0, 25)
            : [];
        const themeDiffEntries = themeDiffEntriesRaw
            .filter((d) =>
                diffFilterPath
                    ? d.path.toLowerCase().includes(diffFilterPath.toLowerCase())
                    : true,
            )
            .filter((d) => (diffFilterSource ? d.source === diffFilterSource : true));
        const diffTotalPages = Math.max(1, Math.ceil(themeDiffEntries.length / diffPageSize));
        const safeDiffPage = Math.min(Math.max(diffPage, 1), diffTotalPages);
        const diffEntriesPage = themeDiffEntries.slice(
            (safeDiffPage - 1) * diffPageSize,
            safeDiffPage * diffPageSize,
        );
        const conditionalRules = Array.isArray(table.conditionalRules) ? table.conditionalRules : [];
        const columnStyles = (table.columnStyles || {}) as Record<string, Record<string, unknown>>;
        const columnFormats = (table.columnFormats || {}) as Record<string, string>;
        const policy = {
            canEditTheme: true,
            canPublishRegistry: true,
            canEditGlobalPresets: true,
            lockedPresetIds: [] as string[],
            ...(((customizationDraft as any)?.policy || {}) as Record<string, unknown>),
        } as {
            canEditTheme: boolean;
            canPublishRegistry: boolean;
            canEditGlobalPresets: boolean;
            lockedPresetIds: string[];
        };
        const presetCatalog = Array.isArray((customizationDraft as any)?.presetCatalog)
            ? ((customizationDraft as any).presetCatalog as Array<Record<string, any>>)
            : [];
        const fieldOptions = (this.props.visualization.placeholders || [])
            .flatMap((p: any) => p.items || [])
            .map((item: any) => ({
                value: String(item.guid || ''),
                content: String(item.fakeTitle || item.title || item.guid || ''),
            }))
            .filter((opt, idx, arr) => opt.value && arr.findIndex((x) => x.value === opt.value) === idx);
        const renderHeadOptions = (((this.props.highchartsWidget as any)?.config?.head ||
            (this.props.highchartsWidget as any)?.head ||
            []) as Array<any>)
            .map((h: any, idx: number) => ({
                value: String(h?.id || h?.fieldId || `render-${idx}`),
                content: String(h?.name || h?.formattedName || h?.id || `Колонка ${idx}`),
            }))
            .filter((opt, idx, arr) => arr.findIndex((x) => x.value === opt.value) === idx);
        const applyCurrentStyleToAllZones = () => {
            setTable({
                bodyBg: table.bodyBg ?? table.headerBg,
                bodyColor: table.bodyColor ?? table.headerColor,
                footerBg: table.footerBg ?? table.headerBg,
                footerColor: table.footerColor ?? table.headerColor,
                bodyBorderColor: table.bodyBorderColor ?? table.headerBorderColor ?? table.borderColor,
                footerBorderColor:
                    table.footerBorderColor ?? table.headerBorderColor ?? table.borderColor,
                totalBorderColor:
                    table.totalBorderColor ?? table.headerBorderColor ?? table.borderColor,
                bodyFontSize: table.bodyFontSize ?? table.headerFontSize,
                footerFontSize: table.footerFontSize ?? table.headerFontSize,
                bodyFontWeight: table.bodyFontWeight ?? table.headerFontWeight,
                footerFontWeight: table.footerFontWeight ?? table.headerFontWeight,
                bodyAlign: table.bodyAlign ?? table.headerAlign,
                footerAlign: table.footerAlign ?? table.headerAlign,
            });
        };
        const addRule = () => {
            if (!ruleValue) {
                return;
            }
            if (conditionalRules.length >= 200) {
                this.setState({
                    customizationError:
                        'Достигнут лимит 200 правил. Удалите часть правил для сохранения производительности.',
                });
                return;
            }
            const conditions =
                ruleGroupConditions.length > 0 ? [...ruleGroupConditions] : [];
            setTable({
                conditionalRules: [
                    ...conditionalRules,
                    {
                        op: ruleOp,
                        value: ruleValue,
                        valueTo: ruleValueTo,
                        bg: ruleBg,
                        color: ruleColor,
                        targetFields: selectedFieldIdForRule ? [selectedFieldIdForRule] : undefined,
                        targetZone: ruleTargetZone,
                        targetTreeLevel: ruleTargetTreeLevel ? Number(ruleTargetTreeLevel) : undefined,
                        contextContains: ruleContextContains || undefined,
                        contextDateFrom: ruleContextDateFrom || undefined,
                        contextDateTo: ruleContextDateTo || undefined,
                        logic: ruleLogic,
                        conditions:
                            conditions.length > 0
                                ? conditions.map((c) => ({
                                      op: c.op,
                                      value: c.value,
                                      valueTo: c.valueTo,
                                  }))
                                : undefined,
                    },
                ],
            });
            this.setState({customizationError: ''});
        };
        const addConditionToGroup = () => {
            if (!ruleValue) {
                return;
            }
            this.setState((prev) => ({
                ruleGroupConditions: [
                    ...(prev.ruleGroupConditions || []),
                    {op: ruleOp, value: ruleValue, valueTo: ruleValueTo},
                ],
                ruleValue: '',
                ruleValueTo: '',
            }));
        };
        const applyColumnStyle = () => {
            const key = String(selectedColumnIndex || '0');
            setTable({
                columnStyles: {
                    ...columnStyles,
                    [key]: {
                        width: columnWidthInput,
                        bg: columnBgInput,
                        color: columnColorInput,
                        align: columnAlignInput,
                        fontWeight: columnWeightInput,
                        displayTitle: columnDisplayTitleInput || undefined,
                        order: Number(columnOrderInput || 0),
                        hide: Boolean(columnHideInput),
                        pin: Boolean(columnPinInput),
                    },
                },
            });
            if (selectedFieldIdForRule && selectedFormatPreset && selectedFormatPreset !== 'none') {
                setTable({
                    columnFormats: {
                        ...columnFormats,
                        [selectedFieldIdForRule]: selectedFormatPreset,
                    },
                });
            }
        };
        const exportCustomizationProfile = () => {
            const payload = JSON.stringify(customizationDraft || {}, null, 2);
            const blob = new Blob([payload], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `customization-profile-${visualizationId}.json`;
            link.click();
            URL.revokeObjectURL(url);
        };
        const importCustomizationProfile = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.onchange = () => {
                const file = input.files?.[0];
                if (!file) {
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const parsed = JSON.parse(String(reader.result || '{}'));
                        this.setState({customizationDraft: parsed, customizationDirty: true});
                    } catch {
                        // ignore invalid JSON
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
        const renderPalette = (onPick: (color: string) => void) => (
            <div className={b('palette-row')}>
                {QUICK_REUSABLE_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        className={b('palette-chip')}
                        style={{backgroundColor: color}}
                        onClick={() => onPick(color)}
                    />
                ))}
            </div>
        );
        const control = (label: string, node: React.ReactNode, hint?: string) => (
            <div className={b('control-item')}>
                <div className={b('control-label')}>
                    <span>{label}</span>
                    {hint ? (
                        <span className={b('hint')} title={hint}>
                            ?
                        </span>
                    ) : null}
                </div>
                {node}
            </div>
        );
        const profileOptions = DASHBOARD_VISUALIZATION_PROFILE_OPTIONS.map(({value, title}) => ({
            value,
            content: title,
        }));
        return (
            <div className={b('setting-group')}>
                <div className={b('label', {profileRow: true})}>
                    {i18n('wizard', 'label_customization-profile' as any)}
                </div>
                <Select
                    value={[customizationProfileId || 'default']}
                    options={profileOptions}
                    onUpdate={([value]) =>
                        this.setState({customizationProfileId: String(value || 'default')})
                    }
                    qa="customization-profile-id-input"
                />
                <div className={b('preset-actions')}>
                    <button
                        type="button"
                        className={b('preset-button')}
                        onClick={exportCustomizationProfile}
                    >
                        Экспорт JSON
                    </button>
                    <button
                        type="button"
                        className={b('preset-button')}
                        onClick={importCustomizationProfile}
                    >
                        Импорт JSON
                    </button>
                </div>
                {showAdvancedCustomizationUi ? (
                    <>
                <div className={b('controls-grid')}>
                    {control(
                        'Наследовать тему дашборда',
                        <Select
                            value={[inheritDashboardTheme ? 'on' : 'off']}
                            options={[
                                {value: 'off', content: 'Нет'},
                                {value: 'on', content: 'Да'},
                            ]}
                            onUpdate={([value]) =>
                                this.setState({inheritDashboardTheme: value === 'on'})
                            }
                        />,
                    )}
                    {control(
                        'Права: редактировать темы',
                        <Select
                            value={[policy.canEditTheme ? 'on' : 'off']}
                            options={[
                                {value: 'on', content: 'Разрешено'},
                                {value: 'off', content: 'Запрещено'},
                            ]}
                            onUpdate={([value]) =>
                                this.setState((prev) => ({
                                    customizationDirty: true,
                                    customizationDraft: {
                                        ...(prev.customizationDraft || {}),
                                        policy: {
                                            ...((prev.customizationDraft as any)?.policy || {}),
                                            canEditTheme: value === 'on',
                                        },
                                    },
                                }))
                            }
                        />,
                    )}
                    {control(
                        'Права: публикация в реестр',
                        <Select
                            value={[policy.canPublishRegistry ? 'on' : 'off']}
                            options={[
                                {value: 'on', content: 'Разрешено'},
                                {value: 'off', content: 'Запрещено'},
                            ]}
                            onUpdate={([value]) =>
                                this.setState((prev) => ({
                                    customizationDirty: true,
                                    customizationDraft: {
                                        ...(prev.customizationDraft || {}),
                                        policy: {
                                            ...((prev.customizationDraft as any)?.policy || {}),
                                            canPublishRegistry: value === 'on',
                                        },
                                    },
                                }))
                            }
                        />,
                    )}
                    {control(
                        'Изолировать стиль только для этого чарта',
                        <Select
                            value={[isolateByWidget ? 'on' : 'off']}
                            options={[
                                {value: 'on', content: 'Да (без авто-наследования)'},
                                {value: 'off', content: 'Нет (авто-профили разрешены)'},
                            ]}
                            onUpdate={([value]) =>
                                this.setState({isolateByWidget: value === 'on'})
                            }
                        />,
                    )}
                    {control(
                        'Группа переиспользования (месяц/год и т.п.)',
                        <input
                            className={b('palette-name-input')}
                            value={reuseGroupKey}
                            placeholder="Напр. flight-load-month-year-v1"
                            onChange={(e) => this.setState({reuseGroupKey: e.target.value})}
                        />,
                    )}
                </div>
                <div className={b('preset-actions')}>
                    <button
                        type="button"
                        className={b('preset-button')}
                        onClick={exportCustomizationProfile}
                    >
                        Экспорт профиля
                    </button>
                    <button
                        type="button"
                        className={b('preset-button')}
                        onClick={importCustomizationProfile}
                    >
                        Импорт профиля
                    </button>
                    <button
                        type="button"
                        className={b('preset-button')}
                        disabled={!policy.canPublishRegistry}
                        onClick={() => {
                            const name = String(catalogPresetName || '').trim() || 'Preset';
                            const next = [
                                {
                                    id: `${Date.now()}`,
                                    name,
                                    createdAt: new Date().toISOString(),
                                    status: 'draft',
                                    locked: false,
                                    approvalComment: '',
                                    preset: (customizationDraft || {}) as Record<string, unknown>,
                                },
                                ...presetCatalog,
                            ].slice(0, 100);
                            this.setState((prev) => ({
                                catalogPresetName: '',
                                customizationDirty: true,
                                customizationDraft: {
                                    ...(prev.customizationDraft || {}),
                                    presetCatalog: next,
                                },
                            }));
                        }}
                    >
                        В каталог пресетов
                    </button>
                    <button
                        type="button"
                        className={b('preset-button')}
                        disabled={!policy.canPublishRegistry}
                        onClick={() => {
                            const name = String(historySnapshotName || '').trim() || 'Snapshot';
                            const next = [
                                {
                                    id: `${Date.now()}`,
                                    name,
                                    createdAt: new Date().toISOString(),
                                    customization: (customizationDraft || {}) as Record<string, unknown>,
                                },
                                ...historyItems,
                            ].slice(0, 20);
                            saveHistory(next);
                            this.setState({historySnapshotName: ''});
                        }}
                    >
                        Сохранить версию
                    </button>
                </div>
                <div className={b('palette-manager')}>
                    <input
                        value={catalogPresetName}
                        className={b('palette-name-input')}
                        placeholder="Имя пресета каталога"
                        onChange={(e) => this.setState({catalogPresetName: e.target.value})}
                    />
                    <input
                        value={catalogApprovalComment}
                        className={b('palette-name-input')}
                        placeholder="Комментарий approve/reject"
                        onChange={(e) => this.setState({catalogApprovalComment: e.target.value})}
                    />
                </div>
                {presetCatalog.length ? (
                    <div className={b('saved-palettes')}>
                        {presetCatalog.map((p) => (
                            <div key={String(p.id)} className={b('saved-palette-item')}>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    disabled={p.status !== 'approved'}
                                    onClick={() =>
                                        this.setState({
                                            customizationDirty: true,
                                            customizationDraft: p.preset as Record<string, any>,
                                        })
                                    }
                                >
                                    Применить [{String(p.status)}]: {String(p.name)}
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    disabled={!policy.canEditGlobalPresets || p.locked}
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            customizationDirty: true,
                                            customizationDraft: {
                                                ...(prev.customizationDraft || {}),
                                                presetCatalog: presetCatalog.map((x) =>
                                                    x.id === p.id ? {...x, status: 'pending'} : x,
                                                ),
                                            },
                                        }))
                                    }
                                >
                                    На согласование
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    disabled={!policy.canEditGlobalPresets || p.locked}
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            customizationDirty: true,
                                            customizationDraft: {
                                                ...(prev.customizationDraft || {}),
                                                presetCatalog: presetCatalog.map((x) =>
                                                    x.id === p.id
                                                        ? {
                                                              ...x,
                                                              status: 'approved',
                                                              approvalComment: catalogApprovalComment,
                                                          }
                                                        : x,
                                                ),
                                            },
                                        }))
                                    }
                                >
                                    Согласовать
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    disabled={!policy.canEditGlobalPresets || p.locked}
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            customizationDirty: true,
                                            customizationDraft: {
                                                ...(prev.customizationDraft || {}),
                                                presetCatalog: presetCatalog.map((x) =>
                                                    x.id === p.id
                                                        ? {
                                                              ...x,
                                                              status: 'rejected',
                                                              approvalComment: catalogApprovalComment,
                                                          }
                                                        : x,
                                                ),
                                            },
                                        }))
                                    }
                                >
                                    Отклонить
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    disabled={!policy.canEditGlobalPresets}
                                    onClick={() =>
                                        this.setState((prev) => ({
                                            customizationDirty: true,
                                            customizationDraft: {
                                                ...(prev.customizationDraft || {}),
                                                presetCatalog: presetCatalog.map((x) =>
                                                    x.id === p.id ? {...x, locked: !x.locked} : x,
                                                ),
                                            },
                                        }))
                                    }
                                >
                                    {p.locked ? 'Разблокировать' : 'Заблокировать'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
                <div className={b('palette-manager')}>
                    <input
                        value={historySnapshotName}
                        className={b('palette-name-input')}
                        placeholder="Имя версии профиля"
                        onChange={(e) => this.setState({historySnapshotName: e.target.value})}
                    />
                </div>
                {historyItems.length ? (
                    <div className={b('saved-palettes')}>
                        {historyItems.map((item) => (
                            <div key={item.id} className={b('saved-palette-item')}>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() =>
                                        this.setState({
                                            customizationDirty: true,
                                            customizationDraft: item.customization as Record<string, any>,
                                        })
                                    }
                                >
                                    Rollback: {item.name}
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() =>
                                        saveHistory(historyItems.filter((x) => x.id !== item.id))
                                    }
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
                <div className={b('label', {spaced: true})}>Реестр тем</div>
                <div className={b('palette-manager')}>
                    <input
                        value={themeRegistryName}
                        className={b('palette-name-input')}
                        placeholder="Имя темы для реестра"
                        onChange={(e) => this.setState({themeRegistryName: e.target.value})}
                    />
                </div>
                <div className={b('preset-actions')}>
                    <button
                        type="button"
                        className={b('preset-button')}
                        onClick={() => {
                            const name = String(themeRegistryName || '').trim() || 'Theme';
                            const next = [
                                {
                                    id: `${Date.now()}`,
                                    name,
                                    createdAt: new Date().toISOString(),
                                    theme: (customizationDraft || {}) as Record<string, unknown>,
                                },
                                ...themeRegistry,
                            ].slice(0, 50);
                            saveThemeRegistry(next);
                            this.setState({themeRegistryName: ''});
                        }}
                    >
                        Сохранить в реестр
                    </button>
                </div>
                <div className={b('rule-builder')}>
                    <Select
                        value={[selectedThemeCompareId || '']}
                        options={[
                            {value: '', content: 'Выберите тему для diff'},
                            ...themeRegistry.map((t) => ({value: t.id, content: t.name})),
                        ]}
                        onUpdate={([value]) =>
                            this.setState({selectedThemeCompareId: String(value || '')})
                        }
                    />
                    <div className={b('control-label')}>Diff ключей: {themeDiffCount}</div>
                    <input
                        className={b('palette-name-input')}
                        value={diffFilterPath}
                        placeholder="Фильтр по пути"
                        onChange={(e) => this.setState({diffFilterPath: e.target.value, diffPage: 1})}
                    />
                    <Select
                        value={[diffFilterSource || '']}
                        options={[
                            {value: '', content: 'Все источники'},
                            {value: 'rule', content: 'rule'},
                            {value: 'zone', content: 'zone'},
                            {value: 'column', content: 'column'},
                            {value: 'theme', content: 'theme'},
                        ]}
                        onUpdate={([value]) =>
                            this.setState({
                                diffFilterSource: (String(value || '') as State['diffFilterSource']) || '',
                                diffPage: 1,
                            })
                        }
                    />
                </div>
                {diffEntriesPage.length ? (
                    <div className={b('saved-palettes')}>
                        {diffEntriesPage.map((d) => (
                            <div key={d.path} className={b('saved-palette-item')}>
                                <span>{d.path}</span>
                                <span>old: {d.oldValue}</span>
                                <span>new: {d.newValue}</span>
                                <span>источник: {d.source}</span>
                            </div>
                        ))}
                        <div className={b('saved-palette-item')}>
                            <button
                                type="button"
                                className={b('preset-button')}
                                disabled={safeDiffPage <= 1}
                                onClick={() => this.setState({diffPage: safeDiffPage - 1})}
                            >
                                Назад
                            </button>
                            <span>
                                Страница {safeDiffPage}/{diffTotalPages}
                            </span>
                            <button
                                type="button"
                                className={b('preset-button')}
                                disabled={safeDiffPage >= diffTotalPages}
                                onClick={() => this.setState({diffPage: safeDiffPage + 1})}
                            >
                                Вперёд
                            </button>
                        </div>
                    </div>
                ) : null}
                {themeRegistry.length ? (
                    <div className={b('saved-palettes')}>
                        {themeRegistry.map((item) => (
                            <div key={item.id} className={b('saved-palette-item')}>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() =>
                                        this.setState({
                                            customizationDirty: true,
                                            customizationDraft: item.theme as Record<string, any>,
                                        })
                                    }
                                >
                                    Применить тему: {item.name}
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() =>
                                        saveThemeRegistry(themeRegistry.filter((x) => x.id !== item.id))
                                    }
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
                    </>
                ) : null}
                {showPieManualLegendControls ? (
                    <div className={b('label', {spaced: true})}>Круговая диаграмма / Легенда</div>
                ) : null}
                {showPieManualLegendControls ? (
                    <div className={b('section-help')}>
                        Настройте сначала 3 параметра: размер заголовка, отдаление от центра, расстояние между секторами. Для полос в легенде выберите форму "Прямоугольник".
                    </div>
                ) : null}
                {showPieManualLegendControls ? (
                    <div className={b('preset-actions')}>
                        <button
                            type="button"
                            className={b('preset-button')}
                            onClick={() => {
                                setPie({
                                    titleFontSize: 18,
                                    titleFontWeight: '700',
                                    slicedOffset: 22,
                                    pointOffset: 22,
                                    borderWidth: 0,
                                    borderColor: 'transparent',
                                });
                                setPieLegend({
                                    position: 'right',
                                    itemDistance: 10,
                                    symbolType: 'rect',
                                    symbolWidth: 14,
                                    symbolHeight: 4,
                                    symbolRadius: 0,
                                    symbolPadding: 8,
                                });
                            }}
                        >
                            Пресет: эталон 7-го дашборда
                        </button>
                    </div>
                ) : null}
                {showPieManualLegendControls ? <div className={b('controls-grid')}>
                    {control(
                        'Размер заголовка',
                        <RangeInputPicker
                            value={Number(pie.titleFontSize ?? 18)}
                            minValue={10}
                            maxValue={36}
                            step={1}
                            onUpdate={(value) => setPie({titleFontSize: value})}
                        />,
                        'Размер шрифта заголовка диаграммы в пикселях',
                    )}
                    {control(
                        'Отдаление от центра',
                        <RangeInputPicker
                            value={Number(pie.slicedOffset ?? 22)}
                            minValue={0}
                            maxValue={120}
                            step={1}
                            onUpdate={(value) => setPie({slicedOffset: value})}
                        />,
                        'Насколько далеко сектор уходит от центра',
                    )}
                    {control(
                        'Расстояние между секторами',
                        <RangeInputPicker
                            value={Number(pie.pointOffset ?? 22)}
                            minValue={0}
                            maxValue={120}
                            step={1}
                            onUpdate={(value) => setPie({pointOffset: value})}
                        />,
                        'Зазор между соседними секторами',
                    )}
                    {control(
                        'Толщина границы сектора',
                        <RangeInputPicker
                            value={Number(pie.borderWidth ?? 3)}
                            minValue={0}
                            maxValue={8}
                            step={1}
                            onUpdate={(value) => setPie({borderWidth: value})}
                        />,
                        '0 = без обводки (часто убирает белые артефакты у центра)',
                    )}
                </div> : null}
                {showPieManualLegendControls ? <div className={b('controls-grid')}>
                    {control(
                        'Положение легенды',
                        <Select
                            value={[String(pieLegend.position ?? 'right')]}
                            options={[
                                {value: 'right', content: 'Легенда справа'},
                                {value: 'bottom', content: 'Легенда снизу'},
                            ]}
                            onUpdate={([value]) => setPieLegend({position: value})}
                        />,
                        'Для эталона используйте "Легенда справа"',
                    )}
                    {control(
                        'Интервал пунктов легенды',
                        <RangeInputPicker
                            value={Number(pieLegend.itemDistance ?? 10)}
                            minValue={0}
                            maxValue={40}
                            step={1}
                            onUpdate={(value) => setPieLegend({itemDistance: value})}
                        />,
                        'Расстояние между строками легенды',
                    )}
                    {control(
                        'Форма маркера легенды',
                        <Select
                            value={[String(pieLegend.symbolType ?? 'rect')]}
                            options={[
                                {value: 'rect', content: 'Прямоугольник'},
                                {value: 'circle', content: 'Круг'},
                            ]}
                            onUpdate={([value]) =>
                                setPieLegend({symbolType: value === 'circle' ? 'circle' : 'rect'})
                            }
                        />,
                        'Для эталона используйте "Прямоугольник"',
                    )}
                </div> : null}
                {showPieManualLegendControls ? <div className={b('controls-grid')}>
                    {control(
                        'Ширина маркера',
                        <RangeInputPicker
                            value={Number(pieLegend.symbolWidth ?? 14)}
                            minValue={4}
                            maxValue={40}
                            step={1}
                            onUpdate={(value) => setPieLegend({symbolWidth: value})}
                        />,
                        'Пример: 14-18 для тонкой полоски как в эталоне',
                    )}
                    {control(
                        'Высота маркера',
                        <RangeInputPicker
                            value={Number(pieLegend.symbolHeight ?? 4)}
                            minValue={2}
                            maxValue={24}
                            step={1}
                            onUpdate={(value) => setPieLegend({symbolHeight: value})}
                        />,
                        'Пример: 4-6 для прямоугольных полос',
                    )}
                    {control(
                        'Скругление маркера',
                        <RangeInputPicker
                            value={Number(pieLegend.symbolRadius ?? 0)}
                            minValue={0}
                            maxValue={20}
                            step={1}
                            onUpdate={(value) => setPieLegend({symbolRadius: value})}
                        />,
                        '0 = острые углы (прямоугольник), >0 = скругление',
                    )}
                </div> : null}
                {showPieManualLegendControls ? (
                    <div className={b('label', {spaced: true})}>Цвет границы секторов</div>
                ) : null}
                {showPieManualLegendControls ? (
                    <ColorPickerInput
                        value={pie.borderColor || '#ffffff'}
                        onUpdate={(value) => setPie({borderColor: value || '#ffffff'})}
                    />
                ) : null}
                {showPieManualLegendControls ? renderPalette((color) => setPie({borderColor: color})) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('section-help')}>
                        Рекомендуемый порядок: 1) цвета зон, 2) размеры, 3) условное форматирование, 4) per-column конструктор.
                    </div>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('label', {spaced: true})}>
                        {isPivotTable ? 'Сводная таблица: цвета зон' : 'Таблица: цвета зон'}
                    </div>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('preset-actions')}>
                        <button
                            type="button"
                            className={b('preset-button')}
                            onClick={() =>
                                setTable({
                                    headerBg: '#7f9fd3',
                                    headerColor: '#ffffff',
                                    bodyBg: '#aec3e7',
                                    bodyColor: '#1f3f73',
                                    footerBg: '#7f9fd3',
                                    footerColor: '#ffffff',
                                    borderColor: '#b5c7e6',
                                })
                            }
                        >
                            Пресет: синий корпоративный
                        </button>
                        <button
                            type="button"
                            className={b('preset-button')}
                            onClick={() =>
                                setTable({
                                    headerBg: '#ffffff',
                                    headerColor: '#1f3f73',
                                    bodyBg: '#ffffff',
                                    bodyColor: '#1a1a2e',
                                    footerBg: '#eef4ff',
                                    footerColor: '#1f3f73',
                                    borderColor: '#d3dced',
                                })
                            }
                        >
                            Пресет: светлый
                        </button>
                        <button
                            type="button"
                            className={b('preset-button')}
                            onClick={() => {
                                const name = String(paletteNameInput || '').trim();
                                if (!name) {
                                    return;
                                }
                                const next = [
                                    ...savedPalettes.filter((p) => p.name !== name),
                                    {name, table},
                                ];
                                savePalettes(next);
                                this.setState({paletteNameInput: ''});
                            }}
                        >
                            Сохранить набор
                        </button>
                        <button
                            type="button"
                            className={b('preset-button')}
                            onClick={applyCurrentStyleToAllZones}
                        >
                            Применить ко всем зонам
                        </button>
                    </div>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('palette-manager')}>
                        <input
                            value={paletteNameInput}
                            className={b('palette-name-input')}
                            placeholder="Название набора палитры"
                            onChange={(e) => this.setState({paletteNameInput: e.target.value})}
                        />
                    </div>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('controls-grid')}>
                        {control(
                            'Показывать шапку',
                            <Select
                                value={[table.showHeader === false ? 'off' : 'on']}
                                options={[
                                    {value: 'on', content: 'Да'},
                                    {value: 'off', content: 'Нет'},
                                ]}
                                onUpdate={([value]) => setTable({showHeader: value !== 'off'})}
                            />,
                            'Скрывает/показывает строку заголовков таблицы',
                        )}
                        {control(
                            'Показывать итоги',
                            <Select
                                value={[table.showTotals === false ? 'off' : 'on']}
                                options={[
                                    {value: 'on', content: 'Да'},
                                    {value: 'off', content: 'Нет'},
                                ]}
                                onUpdate={([value]) => setTable({showTotals: value !== 'off'})}
                            />,
                            'Показывает итоговую строку/колонку, если она есть в чарте',
                        )}
                        {control(
                            'Показывать футер',
                            <Select
                                value={[table.showFooter === false ? 'off' : 'on']}
                                options={[
                                    {value: 'on', content: 'Да'},
                                    {value: 'off', content: 'Нет'},
                                ]}
                                onUpdate={([value]) => setTable({showFooter: value !== 'off'})}
                            />,
                            'Включает нижний блок итогов/подвала',
                        )}
                    </div>
                ) : null}
                {isFlatTable && customizationTab === 'table' ? (
                    <>
                        <div className={b('label', {spaced: true})}>Двухуровневая шапка</div>
                        <div className={b('section-help')}>
                            Укажите две смежные колонки с полки (слева направо): общий заголовок сверху, подписи колонок
                            снизу. Если колонки не стоят рядом, группа не применится.
                        </div>
                        <div className={b('controls-grid')}>
                            {control(
                                'Колонка 1 (левая, верхняя подпись)',
                                <Select
                                    value={[
                                        String(table.headerColumnGroups?.[0]?.parentFieldGuid ?? ''),
                                    ]}
                                    options={[
                                        {value: '', content: '— не использовать —'},
                                        ...fieldOptions,
                                    ]}
                                    onUpdate={([parentFieldGuid]) => {
                                        const cur = table.headerColumnGroups?.[0];
                                        const child = String(cur?.childFieldGuid ?? '');
                                        const p = String(parentFieldGuid ?? '');
                                        if (!p || !child || p === child) {
                                            setTable({headerColumnGroups: []});
                                            return;
                                        }
                                        setTable({
                                            headerColumnGroups: [
                                                {
                                                    parentFieldGuid: p,
                                                    childFieldGuid: child,
                                                    topTitle: cur?.topTitle,
                                                },
                                            ],
                                        });
                                    }}
                                />,
                                'Например cclass',
                            )}
                            {control(
                                'Колонка 2 (правая)',
                                <Select
                                    value={[
                                        String(table.headerColumnGroups?.[0]?.childFieldGuid ?? ''),
                                    ]}
                                    options={[
                                        {value: '', content: '— не использовать —'},
                                        ...fieldOptions,
                                    ]}
                                    onUpdate={([childFieldGuid]) => {
                                        const cur = table.headerColumnGroups?.[0];
                                        const parent = String(cur?.parentFieldGuid ?? '');
                                        const c = String(childFieldGuid ?? '');
                                        if (!parent || !c || parent === c) {
                                            setTable({headerColumnGroups: []});
                                            return;
                                        }
                                        setTable({
                                            headerColumnGroups: [
                                                {
                                                    parentFieldGuid: parent,
                                                    childFieldGuid: c,
                                                    topTitle: cur?.topTitle,
                                                },
                                            ],
                                        });
                                    }}
                                />,
                                'Должна идти сразу после колонки 1. Например class',
                            )}
                            {control(
                                'Текст объединённой шапки',
                                <input
                                    className={b('palette-name-input')}
                                    value={String(table.headerColumnGroups?.[0]?.topTitle ?? '')}
                                    placeholder="Пусто = заголовок первой колонки"
                                    onChange={(e) => {
                                        const cur = table.headerColumnGroups?.[0];
                                        if (!cur?.parentFieldGuid || !cur?.childFieldGuid) {
                                            return;
                                        }
                                        setTable({
                                            headerColumnGroups: [
                                                {
                                                    ...cur,
                                                    topTitle: e.target.value,
                                                },
                                            ],
                                        });
                                    }}
                                />,
                                'Необязательно: иначе берётся подпись первой колонки',
                            )}
                        </div>
                        <div className={b('label', {spaced: true})}>Заливка целой строки тела</div>
                        <div className={b('section-help')}>
                            Индекс строки — 0 для первой строки данных (после скрытия/упорядочивания колонок индексы
                            колонок те же).
                        </div>
                        <div className={b('rule-builder')}>
                            <input
                                className={b('palette-name-input')}
                                value={flatRowStyleIdx}
                                placeholder="Индекс строки (0...)"
                                onChange={(e) => this.setState({flatRowStyleIdx: e.target.value})}
                            />
                            <ColorPickerInput
                                value={flatRowStyleBg}
                                onUpdate={(value) =>
                                    this.setState({flatRowStyleBg: value || '#e8f0fc'})
                                }
                            />
                            <ColorPickerInput
                                value={flatRowStyleColor || '#1f3f73'}
                                onUpdate={(value) => this.setState({flatRowStyleColor: value || ''})}
                            />
                            <button
                                type="button"
                                className={b('preset-button')}
                                onClick={() => {
                                    const ri = parseInt(String(flatRowStyleIdx).trim(), 10);
                                    if (Number.isNaN(ri) || ri < 0) {
                                        return;
                                    }
                                    setTable({
                                        rowStyles: {
                                            ...(table.rowStyles || {}),
                                            [String(ri)]: {
                                                bg: flatRowStyleBg,
                                                ...(flatRowStyleColor
                                                    ? {color: flatRowStyleColor}
                                                    : {}),
                                            },
                                        },
                                    });
                                }}
                            >
                                Записать строку
                            </button>
                        </div>
                        {Object.keys(table.rowStyles || {}).length ? (
                            <div className={b('saved-palettes')}>
                                {Object.entries(table.rowStyles || {}).map(([k, v]) => (
                                    <div key={k} className={b('saved-palette-item')}>
                                        <span>
                                            Строка {k}: bg {(v as {bg?: string}).bg},{' '}
                                            color {(v as {color?: string}).color || '—'}
                                        </span>
                                        <button
                                            type="button"
                                            className={b('preset-button')}
                                            onClick={() => {
                                                const rs = {...(table.rowStyles || {})};
                                                delete rs[k];
                                                setTable({rowStyles: rs});
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <div className={b('label', {spaced: true})}>Заливка одной ячейки</div>
                        <div className={b('rule-builder')}>
                            <input
                                className={b('palette-name-input')}
                                value={flatCellOvRow}
                                placeholder="Строка"
                                onChange={(e) => this.setState({flatCellOvRow: e.target.value})}
                            />
                            <input
                                className={b('palette-name-input')}
                                value={flatCellOvCol}
                                placeholder="Колонка"
                                onChange={(e) => this.setState({flatCellOvCol: e.target.value})}
                            />
                            <ColorPickerInput
                                value={flatCellOvBg}
                                onUpdate={(value) =>
                                    this.setState({flatCellOvBg: value || '#fff3cd'})
                                }
                            />
                            <ColorPickerInput
                                value={flatCellOvColor}
                                onUpdate={(value) =>
                                    this.setState({flatCellOvColor: value || '#1f3f73'})
                                }
                            />
                            <button
                                type="button"
                                className={b('preset-button')}
                                onClick={() => {
                                    const r = parseInt(String(flatCellOvRow).trim(), 10);
                                    const c = parseInt(String(flatCellOvCol).trim(), 10);
                                    if (Number.isNaN(r) || Number.isNaN(c) || r < 0 || c < 0) {
                                        return;
                                    }
                                    const key = `${r},${c}`;
                                    setTable({
                                        cellStyleOverrides: {
                                            ...(table.cellStyleOverrides || {}),
                                            [key]: {
                                                bg: flatCellOvBg,
                                                color: flatCellOvColor,
                                            },
                                        },
                                    });
                                }}
                            >
                                Записать ячейку
                            </button>
                        </div>
                        {Object.keys(table.cellStyleOverrides || {}).length ? (
                            <div className={b('saved-palettes')}>
                                {Object.entries(table.cellStyleOverrides || {}).map(([k, v]) => (
                                    <div key={k} className={b('saved-palette-item')}>
                                        <span>
                                            [{k}] bg {(v as {bg?: string}).bg},{' '}
                                            color {(v as {color?: string}).color || '—'}
                                        </span>
                                        <button
                                            type="button"
                                            className={b('preset-button')}
                                            onClick={() => {
                                                const co = {...(table.cellStyleOverrides || {})};
                                                delete co[k];
                                                setTable({cellStyleOverrides: co});
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <>
                        <div className={b('label', {spaced: true})}>Плотность, шапка и пустые ячейки</div>
                        <div className={b('rule-builder')}>
                            <Select
                                value={[String(table.densityProfile || 'legacy-desktop')]}
                                options={[
                                    {value: 'legacy-desktop', content: 'Плотность: legacy-desktop'},
                                    {value: 'compact', content: 'Плотность: компактная'},
                                    {value: 'normal', content: 'Плотность: normal'},
                                ]}
                                onUpdate={([value]) => setTable({densityProfile: value})}
                            />
                            <Select
                                value={[String(table.headerSkin || 'classic-blue')]}
                                options={[
                                    {value: 'classic-blue', content: 'Шапка: классическая синяя'},
                                    {value: 'flat-light', content: 'Шапка: светлая плоская'},
                                    {value: 'default', content: 'Шапка: по умолчанию'},
                                ]}
                                onUpdate={([value]) => setTable({headerSkin: value})}
                            />
                            <Select
                                value={[String(table.emptyCellPolicy || 'blank')]}
                                options={[
                                    {value: 'blank', content: 'Пустые: пусто'},
                                    {value: 'zero', content: 'Пустые: zero'},
                                    {value: 'dash', content: 'Пустые: -'},
                                ]}
                                onUpdate={([value]) => setTable({emptyCellPolicy: value})}
                            />
                            <Select
                                value={[String(table.thresholdPack || 'none')]}
                                options={[
                                    {value: 'none', content: 'Пороги: none'},
                                    {value: 'zpk-traffic', content: 'Пороги: ZPK traffic'},
                                    {value: 'kpi-soft', content: 'Пороги: KPI мягкие'},
                                ]}
                                onUpdate={([value]) => setTable({thresholdPack: value})}
                            />
                        </div>
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <>
                        <div className={b('section-help')}>
                            "Нечетные" и "четные" управляют шахматной подложкой строк. Пример: нечетные слегка голубые, четные белые.
                        </div>
                        <div className={b('label', {spaced: true})}>Зебра строк</div>
                        <div className={b('controls-grid')}>
                            {control(
                                'Нечетные строки',
                                <ColorPickerInput
                                    value={table.zebraOddBg || '#f6f9ff'}
                                    onUpdate={(value) => setTable({zebraOddBg: value || '#f6f9ff'})}
                                />,
                                'Например: #F6F9FF',
                            )}
                            {control(
                                'Четные строки',
                                <ColorPickerInput
                                    value={table.zebraEvenBg || '#ffffff'}
                                    onUpdate={(value) => setTable({zebraEvenBg: value || '#ffffff'})}
                                />,
                                'Например: #FFFFFF',
                            )}
                        </div>
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <>
                        <div className={b('label', {spaced: true})}>Условное форматирование</div>
                        <div className={b('section-help')}>
                            Пример правила: "Больше чем 80" + зеленый фон + целевая зона body. Если нужно правило на конкретную колонку, выберите поле.
                        </div>
                        <div className={b('preset-actions')}>
                            <button
                                type="button"
                                className={b('preset-button')}
                                disabled={!policy.canEditGlobalPresets}
                                onClick={() =>
                                    setTable({
                                        conditionalRules: [
                                            {op: 'lt', value: '60', bg: '#f8d7da', color: '#7a1f2b'},
                                            {
                                                op: 'between',
                                                value: '60',
                                                valueTo: '80',
                                                bg: '#fff3cd',
                                                color: '#5f4b00',
                                            },
                                            {op: 'gt', value: '80', bg: '#d1e7dd', color: '#0f5132'},
                                        ],
                                    })
                                }
                            >
                                Пресет: KPI/светофор
                            </button>
                            <button
                                type="button"
                                className={b('preset-button')}
                                disabled={!policy.canEditGlobalPresets}
                                onClick={() =>
                                    setTable({
                                        conditionalRules: [
                                            {op: 'lt', value: '0', bg: '#fde2e2', color: '#8f1d1d'},
                                            {op: 'between', value: '0', valueTo: '50', bg: '#fff6d8'},
                                            {op: 'gt', value: '50', bg: '#e2f6e9', color: '#125a2a'},
                                        ],
                                    })
                                }
                            >
                                Пресет: мягкая тепловая карта
                            </button>
                        </div>
                        <div className={b('rule-builder')}>
                            <Select
                                value={[ruleOp]}
                                options={[
                                    {value: 'gt', content: 'Больше чем'},
                                    {value: 'lt', content: 'Меньше чем'},
                                    {value: 'eq', content: 'Равно'},
                                    {value: 'between', content: 'Между'},
                                    {value: 'contains', content: 'Содержит'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({ruleOp: value as State['ruleOp']})
                                }
                            />
                            <Select
                                value={[selectedFieldIdForRule || '']}
                                options={[
                                    {value: '', content: 'Все колонки'},
                                    ...renderHeadOptions,
                                    ...fieldOptions,
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({selectedFieldIdForRule: String(value || '')})
                                }
                            />
                            <Select
                                value={[ruleTargetZone]}
                                options={[
                                    {value: 'body', content: 'Зона: body'},
                                    {value: 'header', content: 'Зона: header'},
                                    {value: 'footer', content: 'Зона: footer'},
                                    {value: 'total', content: 'Зона: total'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({
                                        ruleTargetZone: value as State['ruleTargetZone'],
                                    })
                                }
                            />
                            <Select
                                value={[ruleLogic]}
                                options={[
                                    {value: 'AND', content: 'Группа: AND'},
                                    {value: 'OR', content: 'Группа: OR'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({ruleLogic: value as State['ruleLogic']})
                                }
                            />
                            <input
                                className={b('palette-name-input')}
                                value={ruleValue}
                                placeholder="Значение"
                                onChange={(e) => this.setState({ruleValue: e.target.value})}
                            />
                            {ruleOp === 'between' ? (
                                <input
                                    className={b('palette-name-input')}
                                    value={ruleValueTo}
                                    placeholder="До"
                                    onChange={(e) => this.setState({ruleValueTo: e.target.value})}
                                />
                            ) : null}
                            <ColorPickerInput
                                value={ruleBg}
                                onUpdate={(value) => this.setState({ruleBg: value || '#fff2a8'})}
                            />
                            <ColorPickerInput
                                value={ruleColor}
                                onUpdate={(value) => this.setState({ruleColor: value || '#1f3f73'})}
                            />
                            <input
                                className={b('palette-name-input')}
                                value={ruleTargetTreeLevel}
                                placeholder="Уровень дерева (pivot)"
                                onChange={(e) =>
                                    this.setState({ruleTargetTreeLevel: e.target.value})
                                }
                            />
                            <input
                                className={b('palette-name-input')}
                                value={ruleContextContains}
                                placeholder="Контекст содержит (срез)"
                                onChange={(e) =>
                                    this.setState({ruleContextContains: e.target.value})
                                }
                            />
                            <input
                                className={b('palette-name-input')}
                                value={ruleContextDateFrom}
                                placeholder="Дата от (YYYY-MM-DD)"
                                onChange={(e) =>
                                    this.setState({ruleContextDateFrom: e.target.value})
                                }
                            />
                            <input
                                className={b('palette-name-input')}
                                value={ruleContextDateTo}
                                placeholder="Дата до (YYYY-MM-DD)"
                                onChange={(e) =>
                                    this.setState({ruleContextDateTo: e.target.value})
                                }
                            />
                            <button
                                type="button"
                                className={b('preset-button')}
                                onClick={addConditionToGroup}
                            >
                                Добавить условие в группу
                            </button>
                            <button type="button" className={b('preset-button')} onClick={addRule}>
                                Добавить правило
                            </button>
                        </div>
                        {ruleGroupConditions.length ? (
                            <div className={b('priority-list')}>
                                {ruleGroupConditions.map((cond, idx) => (
                                    <div
                                        key={`${cond.op}-${idx}`}
                                        className={b('priority-item')}
                                        draggable
                                        onDragStart={() =>
                                            this.setState({draggedRuleConditionIndex: idx})
                                        }
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => {
                                            const src = this.state.draggedRuleConditionIndex;
                                            if (typeof src !== 'number' || src === idx) {
                                                return;
                                            }
                                            const next = [...ruleGroupConditions];
                                            const [item] = next.splice(src, 1);
                                            next.splice(idx, 0, item);
                                            this.setState({
                                                ruleGroupConditions: next,
                                                draggedRuleConditionIndex: undefined,
                                            });
                                        }}
                                    >
                                        {String(cond.op)} {String(cond.value || '')}
                                        {cond.op === 'between'
                                            ? ` .. ${String(cond.valueTo || '')}`
                                            : ''}
                                        <button
                                            type="button"
                                            className={b('preset-button')}
                                            onClick={() =>
                                                this.setState({
                                                    ruleGroupConditions: ruleGroupConditions.filter(
                                                        (_c, i) => i !== idx,
                                                    ),
                                                })
                                            }
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        {customizationError ? (
                            <div className={b('error')}>{customizationError}</div>
                        ) : null}
                        {conditionalRules.length ? (
                            <div className={b('saved-palettes')}>
                                {conditionalRules.map((rule: Record<string, unknown>, index: number) => (
                                    <div key={`${rule.op}-${index}`} className={b('saved-palette-item')}>
                                        <span>
                                            {String(rule.op)} {String(rule.value ?? '')}{' '}
                                            {rule.op === 'between' ? `.. ${String(rule.valueTo ?? '')}` : ''}
                                        </span>
                                        <button
                                            type="button"
                                            className={b('preset-button')}
                                            onClick={() =>
                                                setTable({
                                                    conditionalRules: conditionalRules.filter(
                                                        (_: unknown, i: number) => i !== index,
                                                    ),
                                                })
                                            }
                                        >
                                            Удалить правило
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <>
                        <div className={b('label', {spaced: true})}>Per-column конструктор</div>
                        <div className={b('section-help')}>
                            Выберите индекс или поле, затем нажмите "Применить к колонке". Так можно отдельно задать ширину, цвет, скрытие и закрепление.
                        </div>
                        <div className={b('rule-builder')}>
                            <input
                                className={b('palette-name-input')}
                                value={selectedColumnIndex}
                                placeholder="Индекс колонки (0..N)"
                                onChange={(e) => this.setState({selectedColumnIndex: e.target.value})}
                            />
                            <Select
                                value={[selectedFieldIdForRule || '']}
                                options={[
                                    {value: '', content: 'Поле не выбрано'},
                                    ...renderHeadOptions,
                                    ...fieldOptions,
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({selectedFieldIdForRule: String(value || '')})
                                }
                            />
                            <RangeInputPicker
                                value={Number(columnWidthInput ?? 120)}
                                minValue={40}
                                maxValue={400}
                                step={2}
                                onUpdate={(value) => this.setState({columnWidthInput: value})}
                            />
                            <ColorPickerInput
                                value={columnBgInput}
                                onUpdate={(value) =>
                                    this.setState({columnBgInput: value || '#ffffff'})
                                }
                            />
                            <ColorPickerInput
                                value={columnColorInput}
                                onUpdate={(value) =>
                                    this.setState({columnColorInput: value || '#1f3f73'})
                                }
                            />
                            <Select
                                value={[columnAlignInput]}
                                options={[
                                    {value: 'left', content: 'Слева'},
                                    {value: 'center', content: 'По центру'},
                                    {value: 'right', content: 'Справа'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({
                                        columnAlignInput: value as State['columnAlignInput'],
                                    })
                                }
                            />
                            <Select
                                value={[columnWeightInput]}
                                options={[
                                    {value: '400', content: 'Нормальный'},
                                    {value: '500', content: 'Полужирный'},
                                    {value: '700', content: 'Жирный'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({columnWeightInput: String(value)})
                                }
                            />
                            <Select
                                value={[selectedFormatPreset]}
                                options={[
                                    {value: 'none', content: 'Формат: без изменений'},
                                    {value: 'integer', content: 'Формат: целое число'},
                                    {value: 'percent1', content: 'Формат: процент (1 знак)'},
                                    {value: 'currency0', content: 'Формат: валюта'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({
                                        selectedFormatPreset:
                                            (String(value || 'none') as State['selectedFormatPreset']) ||
                                            'none',
                                    })
                                }
                            />
                            <input
                                className={b('palette-name-input')}
                                value={columnDisplayTitleInput}
                                placeholder="Отображаемый заголовок"
                                onChange={(e) =>
                                    this.setState({columnDisplayTitleInput: e.target.value})
                                }
                            />
                            <RangeInputPicker
                                value={Number(columnOrderInput ?? 0)}
                                minValue={0}
                                maxValue={200}
                                step={1}
                                onUpdate={(value) => this.setState({columnOrderInput: value})}
                            />
                            <Select
                                value={[columnHideInput ? 'on' : 'off']}
                                options={[
                                    {value: 'off', content: 'Показывать'},
                                    {value: 'on', content: 'Скрыть'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({columnHideInput: value === 'on'})
                                }
                            />
                            <Select
                                value={[columnPinInput ? 'on' : 'off']}
                                options={[
                                    {value: 'off', content: 'Не пинить'},
                                    {value: 'on', content: 'Закрепить'},
                                ]}
                                onUpdate={([value]) =>
                                    this.setState({columnPinInput: value === 'on'})
                                }
                            />
                            <button
                                type="button"
                                className={b('preset-button')}
                                onClick={applyColumnStyle}
                            >
                                Применить к колонке
                            </button>
                        </div>
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <>
                        <div className={b('label', {spaced: true})}>Локаль и единицы</div>
                        <div className={b('section-help')}>
                            Локаль, валюта и суффикс влияют на форматирование чисел в таблице.
                        </div>
                        <div className={b('rule-builder')}>
                            <input
                                className={b('palette-name-input')}
                                value={String(table.locale || 'ru-RU')}
                                placeholder="Локаль, напр. ru-RU"
                                onChange={(e) => setTable({locale: e.target.value})}
                            />
                            <input
                                className={b('palette-name-input')}
                                value={String(table.currency || 'RUB')}
                                placeholder="Валюта, напр. RUB"
                                onChange={(e) => setTable({currency: e.target.value})}
                            />
                            <input
                                className={b('palette-name-input')}
                                value={String(table.suffix || '')}
                                placeholder="Суффикс, напр. шт"
                                onChange={(e) => setTable({suffix: e.target.value})}
                            />
                        </div>
                    </>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? <div className={b('controls-grid')}>
                    {control(
                        'Фон шапки',
                        <ColorPickerInput
                            value={table.headerBg || '#7f9fd3'}
                            onUpdate={(value) => setTable({headerBg: value || '#7f9fd3'})}
                        />,
                        'Пример: #2B5BA8 для корпоративной шапки',
                    )}
                    {control(
                        'Текст шапки',
                        <ColorPickerInput
                            value={table.headerColor || '#ffffff'}
                            onUpdate={(value) => setTable({headerColor: value || '#ffffff'})}
                        />,
                    )}
                    {control(
                        'Фон тела',
                        <ColorPickerInput
                            value={table.bodyBg || '#aec3e7'}
                            onUpdate={(value) => setTable({bodyBg: value || '#aec3e7'})}
                        />,
                    )}
                    {control(
                        'Текст тела',
                        <ColorPickerInput
                            value={table.bodyColor || '#1f3f73'}
                            onUpdate={(value) => setTable({bodyColor: value || '#1f3f73'})}
                        />,
                    )}
                    {control(
                        'Фон итогов',
                        <ColorPickerInput
                            value={table.footerBg || '#7f9fd3'}
                            onUpdate={(value) => setTable({footerBg: value || '#7f9fd3'})}
                        />,
                    )}
                    {control(
                        'Текст итогов',
                        <ColorPickerInput
                            value={table.footerColor || '#ffffff'}
                            onUpdate={(value) => setTable({footerColor: value || '#ffffff'})}
                        />,
                    )}
                    {control(
                        'Граница (общая)',
                        <ColorPickerInput
                            value={table.borderColor || '#b5c7e6'}
                            onUpdate={(value) => setTable({borderColor: value || '#b5c7e6'})}
                        />,
                    )}
                    {control(
                        'Граница шапки',
                        <ColorPickerInput
                            value={table.headerBorderColor || '#b5c7e6'}
                            onUpdate={(value) => setTable({headerBorderColor: value || '#b5c7e6'})}
                        />,
                    )}
                    {control(
                        'Граница тела',
                        <ColorPickerInput
                            value={table.bodyBorderColor || '#b5c7e6'}
                            onUpdate={(value) => setTable({bodyBorderColor: value || '#b5c7e6'})}
                        />,
                    )}
                    {control(
                        'Граница футера',
                        <ColorPickerInput
                            value={table.footerBorderColor || '#b5c7e6'}
                            onUpdate={(value) => setTable({footerBorderColor: value || '#b5c7e6'})}
                        />,
                    )}
                    {control(
                        'Граница total',
                        <ColorPickerInput
                            value={table.totalBorderColor || '#2b5ba8'}
                            onUpdate={(value) => setTable({totalBorderColor: value || '#2b5ba8'})}
                        />,
                    )}
                </div> : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table' ? (
                    <div className={b('controls-grid')}>
                        {control(
                            'Размер шрифта шапки',
                            <RangeInputPicker
                                value={Number(table.headerFontSize ?? 13)}
                                minValue={10}
                                maxValue={24}
                                step={1}
                                onUpdate={(value) => setTable({headerFontSize: value})}
                            />,
                            'Размер текста заголовков колонок',
                        )}
                        {control(
                            'Размер шрифта тела',
                            <RangeInputPicker
                                value={Number(table.bodyFontSize ?? 13)}
                                minValue={10}
                                maxValue={24}
                                step={1}
                                onUpdate={(value) => setTable({bodyFontSize: value})}
                            />,
                            'Размер текста в обычных ячейках',
                        )}
                        {control(
                            'Размер шрифта итогов',
                            <RangeInputPicker
                                value={Number(table.footerFontSize ?? 13)}
                                minValue={10}
                                maxValue={24}
                                step={1}
                                onUpdate={(value) => setTable({footerFontSize: value})}
                            />,
                            'Размер текста в итоговых строках/зонах',
                        )}
                        {control(
                            'Ширина колонок',
                            <RangeInputPicker
                                value={Number(table.columnWidth ?? 120)}
                                minValue={40}
                                maxValue={320}
                                step={2}
                                onUpdate={(value) => setTable({columnWidth: value})}
                            />,
                            'Базовая ширина для колонок, если не задано per-column',
                        )}
                        {control(
                            'Высота строк',
                            <RangeInputPicker
                                value={Number(table.rowHeight ?? 28)}
                                minValue={18}
                                maxValue={60}
                                step={1}
                                onUpdate={(value) => setTable({rowHeight: value})}
                            />,
                            'Высота строки в пикселях',
                        )}
                        {control(
                            'Вес шрифта шапки',
                            <Select
                                value={[String(table.headerFontWeight ?? '700')]}
                                options={[
                                    {value: '400', content: 'Нормальный'},
                                    {value: '500', content: 'Полужирный'},
                                    {value: '700', content: 'Жирный'},
                                ]}
                                onUpdate={([value]) => setTable({headerFontWeight: value})}
                            />,
                        )}
                        {control(
                            'Вес шрифта тела',
                            <Select
                                value={[String(table.bodyFontWeight ?? '400')]}
                                options={[
                                    {value: '400', content: 'Нормальный'},
                                    {value: '500', content: 'Полужирный'},
                                    {value: '700', content: 'Жирный'},
                                ]}
                                onUpdate={([value]) => setTable({bodyFontWeight: value})}
                            />,
                        )}
                        {control(
                            'Вес шрифта итогов',
                            <Select
                                value={[String(table.footerFontWeight ?? '700')]}
                                options={[
                                    {value: '400', content: 'Нормальный'},
                                    {value: '500', content: 'Полужирный'},
                                    {value: '700', content: 'Жирный'},
                                ]}
                                onUpdate={([value]) => setTable({footerFontWeight: value})}
                            />,
                        )}
                        {control(
                            'Выравнивание шапки',
                            <Select
                                value={[String(table.headerAlign ?? 'center')]}
                                options={[
                                    {value: 'left', content: 'Слева'},
                                    {value: 'center', content: 'По центру'},
                                    {value: 'right', content: 'Справа'},
                                ]}
                                onUpdate={([value]) => setTable({headerAlign: value})}
                            />,
                        )}
                        {control(
                            'Выравнивание тела',
                            <Select
                                value={[String(table.bodyAlign ?? 'right')]}
                                options={[
                                    {value: 'left', content: 'Слева'},
                                    {value: 'center', content: 'По центру'},
                                    {value: 'right', content: 'Справа'},
                                ]}
                                onUpdate={([value]) => setTable({bodyAlign: value})}
                            />,
                        )}
                        {control(
                            'Выравнивание итогов',
                            <Select
                                value={[String(table.footerAlign ?? 'right')]}
                                options={[
                                    {value: 'left', content: 'Слева'},
                                    {value: 'center', content: 'По центру'},
                                    {value: 'right', content: 'Справа'},
                                ]}
                                onUpdate={([value]) => setTable({footerAlign: value})}
                            />,
                        )}
                        {control(
                            'Горизонтальные отступы (px)',
                            <RangeInputPicker
                                value={Number(table.cellPaddingX ?? 6)}
                                minValue={0}
                                maxValue={24}
                                step={1}
                                onUpdate={(value) => setTable({cellPaddingX: value})}
                            />,
                            'Отступ текста слева/справа внутри ячейки',
                        )}
                    </div>
                ) : null}
                {(isPivotTable || isFlatTable) && customizationTab === 'table'
                    ? renderPalette((color) => setTable({headerBg: color}))
                    : null}
                {(isPivotTable || isFlatTable) &&
                customizationTab === 'table' &&
                savedPalettes.length ? (
                    <div className={b('saved-palettes')}>
                        {savedPalettes.map((palette) => (
                            <div key={palette.name} className={b('saved-palette-item')}>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() => setTable(palette.table)}
                                >
                                    Применить: {palette.name}
                                </button>
                                <button
                                    type="button"
                                    className={b('preset-button')}
                                    onClick={() =>
                                        savePalettes(savedPalettes.filter((p) => p.name !== palette.name))
                                    }
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    }

    renderModalBody() {
        const {navigatorSettings} = this.state;
        const {isPreviewLoading, qlMode} = this.props;

        const isNavigatorAvailable = navigatorSettings.isNavigatorAvailable;

        if (!qlMode && isPreviewLoading && isNavigatorAvailable) {
            return this.renderLoader();
        }

        return (
            <div className={b('settings')}>
                {this.renderTitleMode()}
                {this.renderWidgetSize()}
                {this.renderLegend()}
                {this.renderTooltip()}
                {this.renderTooltipSum()}
                {this.renderPagination()}
                {this.renderLimit()}
                {this.renderGrouping()}
                {this.renderTotals()}
                {this.renderTableWhiteSpace()}
                {this.renderFeed()}
                {this.renderPivotFallback()}
                {this.renderNavigator()}
                {this.renderQlAutoExecutionChart()}
                {this.renderInlineSortSwitch()}
                {this.renderStackingSwitch()}
                {this.renderMapCenterSetting()}
                {this.renderZoom()}
                {this.renderCustomizationMvp()}
            </div>
        );
    }

    render() {
        const {valid} = this.state;

        return (
            <Dialog open={true} className={b()} onClose={this.props.onCancel}>
                <div className={b('content')}>
                    <Dialog.Header caption={i18n('wizard', 'label_chart-settings')} />
                    <Dialog.Body>{this.renderModalBody()}</Dialog.Body>
                    <Dialog.Footer
                        preset="default"
                        onClickButtonCancel={() => {
                            this.props.onCancel();
                        }}
                        onClickButtonApply={this.onApply}
                        textButtonApply={i18n('wizard', 'button_apply')}
                        textButtonCancel={i18n('wizard', 'button_cancel')}
                        propsButtonApply={{
                            disabled: !valid,
                        }}
                        //@ts-ignore
                        hr={false}
                    />
                </div>
            </Dialog>
        );
    }
}

const mapStateToProps = (state: DatalensGlobalState) => {
    return {
        highchartsWidget: selectHighchartsWidget(state),

        isPreviewLoading: selectIsLoading(state),
    };
};

DialogManager.registerDialog(DIALOG_CHART_SETTINGS, connect(mapStateToProps)(DialogSettings));
