import type {ChartData} from '@gravity-ui/chartkit/gravity-charts';
import {i18n} from 'i18n';
import JSONfn from 'json-fn';
import logger from 'libs/logger';
import {UserSettings} from 'libs/userSettings';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import set from 'lodash/set';
import {WidgetKind} from 'shared/types/widget';
import {getRandomCKId} from 'ui/libs/DatalensChartkit/ChartKit/helpers/getRandomCKId';
import {isEnabledFeature} from 'ui/utils/isEnabledFeature';
import type {Optional} from 'utility-types';

import type {StringParams} from '../../../../../../shared';
import {
    ChartkitHandlers,
    EDITOR_CHART_NODE,
    QL_CHART_NODE,
    SHARED_URL_OPTIONS,
    WIZARD_CHART_NODE,
    WRAPPED_MARKDOWN_KEY,
    WRAPPED_MARKUP_KEY,
    isMarkupItem,
} from '../../../../../../shared';
import {DL} from '../../../../../constants/common';
import {registry} from '../../../../../registry';
import Utils, {getRenderMarkupToStringFn} from '../../../../../utils';
import {getRenderYfmFn as getRenderMarkdownFn} from '../../../../../utils/markdown/get-render-yfm-fn';
import type {
    ControlsOnlyWidget,
    GraphWidget,
    UiSandboxRuntimeOptions,
    Widget,
    WithControls,
} from '../../../types';
import DatalensChartkitCustomError from '../../datalens-chartkit-custom-error/datalens-chartkit-custom-error';
import {getParseHtmlFn} from '../../html-generator/utils';

import {ChartkitHandlersDict} from './chartkit-handlers';
import {getChartsInsightsData} from './helpers';
import type {ChartsData, ResponseSuccessControls, ResponseSuccessNode, UI} from './types';
import {
    UI_SANDBOX_TOTAL_TIME_LIMIT,
    getUISandbox,
    processHtmlFields,
    shouldUseUISandbox,
    unwrapPossibleFunctions,
} from './ui-sandbox';
import {getSafeChartWarnings, isPotentiallyUnsafeChart} from './utils';

import {CHARTS_ERROR_CODE} from '.';

type CurrentResponse = ResponseSuccessNode | ResponseSuccessControls;

function isNodeResponse(loaded: CurrentResponse): loaded is ResponseSuccessNode {
    return 'data' in loaded;
}

function shouldShowSafeChartInfo(params: StringParams) {
    if (!isEnabledFeature('ShowSafeChartInfo')) {
        return false;
    }
    return (
        Utils.getOptionsFromSearch(window.location.search).showSafeChartInfo ||
        (params &&
            SHARED_URL_OPTIONS.SAFE_CHART in params &&
            String(params?.[SHARED_URL_OPTIONS.SAFE_CHART]?.[0]) === '1')
    );
}

/* eslint-disable complexity */
async function processNode<T extends CurrentResponse, R extends Widget | ControlsOnlyWidget>(
    loaded: T,
    noJsonFn?: boolean,
): Promise<R & ChartsData> {
    const {
        type: loadedType,
        params,
        defaultParams,
        id,
        key,
        revId,
        usedParams,
        unresolvedParams,
        sources,
        logs_v2,
        timings,
        dataExport,
        extra,
        requestId,
        traceId,
        widgetConfig,
    } = loaded;

    try {
        let result: Widget & Optional<WithControls> & ChartsData = {
            // @ts-ignore
            type: loadedType.match(/^[^_]*/)![0],
            params: omit(params, 'name'),
            defaultParams,
            entryId: id ?? `fake_${getRandomCKId()}`,
            key,
            revId,
            usedParams,
            sources,
            logs_v2,
            timings,
            dataExport,
            extra,
            requestId,
            traceId,
            isNewWizard: loadedType in WIZARD_CHART_NODE,
            isOldWizard: false,
            isEditor: loadedType in EDITOR_CHART_NODE,
            isQL: loadedType in QL_CHART_NODE,
            widgetConfig,
        };

        if ('unresolvedParams' in loaded) {
            result.unresolvedParams = unresolvedParams;
        }

        if ('publicAuthor' in loaded) {
            const publicAuthor = loaded.publicAuthor;
            (result as GraphWidget).publicAuthor = publicAuthor;
        }

        if (isNodeResponse(loaded)) {
            const parsedConfig = JSON.parse(loaded.config);
            const enableJsAndHtml = get(parsedConfig, 'enableJsAndHtml', true);

            const jsonParse = noJsonFn || enableJsAndHtml === false ? JSON.parse : JSONfn.parse;

            result.data = loaded.data;
            result.config = jsonParse(loaded.config);
            result.libraryConfig = jsonParse(loaded.highchartsConfig);

            if (shouldShowSafeChartInfo(params)) {
                result.safeChartInfo = getSafeChartWarnings(
                    loadedType,
                    pick(result, 'config', 'libraryConfig', 'data'),
                );
            }

            if (
                shouldUseUISandbox(result.config) ||
                shouldUseUISandbox(result.libraryConfig) ||
                shouldUseUISandbox(result.data)
            ) {
                const uiSandbox = await getUISandbox();
                const uiSandboxOptions: UiSandboxRuntimeOptions = {};
                if (!get(loaded.params, SHARED_URL_OPTIONS.WITHOUT_UI_SANDBOX_LIMIT)) {
                    // creating an object for mutation
                    // so that we can calculate the total execution time of the sandbox
                    uiSandboxOptions.totalTimeLimit = UI_SANDBOX_TOTAL_TIME_LIMIT;
                }

                if (result.type === WidgetKind.AdvancedChart) {
                    uiSandboxOptions.fnExecTimeLimit = 1500;
                }

                const unwrapFnArgs = {
                    entryId: result.entryId,
                    entryType: loadedType,
                    sandbox: uiSandbox,
                    options: uiSandboxOptions,
                };
                await unwrapPossibleFunctions({...unwrapFnArgs, target: result.config});
                await unwrapPossibleFunctions({...unwrapFnArgs, target: result.libraryConfig});
                await unwrapPossibleFunctions({...unwrapFnArgs, target: result.data});
                result.uiSandboxOptions = uiSandboxOptions;
            }

            const isWizardOrQl = result.isNewWizard || result.isQL;
            const shouldProcessHtmlFields =
                isPotentiallyUnsafeChart(loadedType) || result.config?.useHtml;
            if (shouldProcessHtmlFields) {
                const parseHtml = await getParseHtmlFn();
                const ignoreInvalidValues = isWizardOrQl;
                const allowHtml = isWizardOrQl ? false : enableJsAndHtml;
                processHtmlFields(result.data, {
                    allowHtml,
                    parseHtml,
                    ignoreInvalidValues,
                    // we expand its below
                    // additional checks should be inside the markup and markdown processing
                    excludedKeys: [WRAPPED_MARKUP_KEY, WRAPPED_MARKDOWN_KEY],
                });
                processHtmlFields(result.libraryConfig, {
                    allowHtml,
                    parseHtml,
                    ignoreInvalidValues,
                });
            }

            await unwrapMarkdown({config: result.config, data: result.data});
            await unwrapMarkup({config: result.config, data: result.data});

            applyChartkitHandlers({
                config: result.config,
                libraryConfig: result.libraryConfig,
                widgetKind: result.type,
            });

            if ('sideMarkdown' in loaded.extra && loaded.extra.sideMarkdown) {
                (result as GraphWidget).sideMarkdown = loaded.extra.sideMarkdown;
            }

            if ('colors' in loaded.extra && loaded.extra.colors) {
                if (result.type === WidgetKind.GravityCharts) {
                    const gravityUIChartsConfig = result.data as ChartData;

                    if (isEmpty(gravityUIChartsConfig.colors)) {
                        gravityUIChartsConfig.colors = loaded.extra?.colors;
                    }
                }

                if (
                    result.type === WidgetKind.Graph &&
                    result.libraryConfig &&
                    isEmpty(result.libraryConfig.colors)
                ) {
                    result.libraryConfig.colors = loaded.extra.colors;
                }
            }

            if ('chartsInsights' in loaded.extra && loaded.extra.chartsInsights) {
                const {chartsInsightsLocators = ''} = UserSettings.getInstance().getSettings();

                try {
                    const locators = chartsInsightsLocators
                        ? JSON.parse(chartsInsightsLocators)
                        : {};

                    const chartsInsightsData = getChartsInsightsData(
                        loaded.extra.chartsInsights,
                        locators,
                    );
                    (result as GraphWidget).chartsInsightsData = chartsInsightsData;
                } catch (error) {
                    logger.logError('ChartsInsights: process data failed', error);
                }
            }

            const postProcessRunResult = registry.chart.functions.get('postProcessRunResult');

            if (postProcessRunResult) {
                result = {...result, ...postProcessRunResult(loaded)};
            }

            if (result.type === 'metric' && result.config && result.config.metricVersion === 2) {
                // @ts-ignore
                result.type = 'metric2';
            }

            if (result.type === 'ymap' && result.libraryConfig) {
                result.libraryConfig.apiKey = DL.YAMAP_API_KEY;
            }
        }

        if ('uiScheme' in loaded) {
            const uiScheme = (loaded as UI).uiScheme;
            if (uiScheme) {
                (result as WithControls).controls = Array.isArray(uiScheme)
                    ? {
                          controls: uiScheme,
                          lineBreaks: 'nowrap',
                      }
                    : uiScheme;
            }
        }

        return result as R & ChartsData;
    } catch (error) {
        throw DatalensChartkitCustomError.wrap(error, {
            code: CHARTS_ERROR_CODE.PROCESSING_ERROR,
            message: i18n('chartkit.data-provider', 'error-processing'),
        });
    }
}

async function unwrapMarkdown(args: {config: Widget['config']; data: Widget['data']}) {
    const {config, data} = args;

    if (config?.useMarkdown) {
        const renderMarkdown = await getRenderMarkdownFn();
        const unwrapItem = (item: unknown) => {
            if (!item || typeof item !== 'object') {
                return;
            }

            if (Array.isArray(item)) {
                item.forEach((value, index, list) => {
                    if (value && typeof value === 'object' && WRAPPED_MARKDOWN_KEY in value) {
                        const md = value[WRAPPED_MARKDOWN_KEY];
                        if (typeof md === 'string') {
                            list[index] = renderMarkdown(md);
                        }
                    } else {
                        unwrapItem(value);
                    }
                });
            } else {
                Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
                    if (value && typeof value === 'object' && WRAPPED_MARKDOWN_KEY in value) {
                        const md = value[WRAPPED_MARKDOWN_KEY];
                        if (typeof md === 'string') {
                            set(item, key, renderMarkdown(md));
                        }
                    } else {
                        unwrapItem(value);
                    }
                });
            }
        };

        try {
            unwrapItem(get(data, 'graphs', []));
            unwrapItem(get(data, 'series.data', []));
            unwrapItem(get(data, 'xAxis'));
            unwrapItem(get(data, 'yAxis'));
            unwrapItem(get(data, 'categories', []));
        } catch (e) {
            console.error(e);
        }
    }
}

async function unwrapMarkup(args: {config: Widget['config']; data: Widget['data']}) {
    const {config, data} = args;
    if (config?.useMarkup) {
        const renderMarkup = await getRenderMarkupToStringFn();
        const unwrapItem = (item: unknown) => {
            if (!item || typeof item !== 'object') {
                return;
            }

            if (Array.isArray(item)) {
                item.forEach((value, index, list) => {
                    if (value && typeof value === 'object' && WRAPPED_MARKUP_KEY in value) {
                        const markupItem = value[WRAPPED_MARKUP_KEY];
                        if (isMarkupItem(markupItem)) {
                            list[index] = renderMarkup(markupItem);
                        }
                    } else {
                        unwrapItem(value);
                    }
                });
            } else {
                Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
                    if (value && typeof value === 'object' && WRAPPED_MARKUP_KEY in value) {
                        const markupItem = value[WRAPPED_MARKUP_KEY];
                        if (isMarkupItem(markupItem)) {
                            set(item, key, renderMarkup(markupItem));
                        }
                    } else {
                        unwrapItem(value);
                    }
                });
            }
        };

        try {
            unwrapItem(get(data, 'graphs', []));
            unwrapItem(get(data, 'series.data', []));
            unwrapItem(get(data, 'categories', []));
        } catch (e) {
            console.error(e);
        }
    }
}

function applyChartkitHandlers(args: {
    config: Widget['config'];
    libraryConfig: Widget['libraryConfig'];
    widgetKind?: string;
}) {
    const {config, libraryConfig, widgetKind} = args;

    if (libraryConfig) {
        const STRICT_ZERO_X_TICK_LENGTH_PX = 1.8;
        const STRICT_ZERO_X_LABEL_DX_PX = -7;
        const STRICT_ZERO_X_LABEL_DY_PX = 6;
        const STRICT_ZERO_X_LABEL_SHIFT_PX = -18;
        const STRICT_ZERO_X_LABEL_VERTICAL_SHIFT_PX = -13;
        const applyDatetimeFormatterToXAxisItem = (axisItem: any) => {
            if (axisItem?.labels?.formatter === ChartkitHandlers.WizardDatetimeAxisFormatter) {
                axisItem.labels.formatter = ChartkitHandlersDict[
                    ChartkitHandlers.WizardDatetimeAxisFormatter
                ](axisItem.labels?.format);
            }
        };
        const applyWizardXFormatterToXAxisItem = (axisItem: any) => {
            if (axisItem?.labels?.formatter === ChartkitHandlers.WizardXAxisFormatter) {
                axisItem.labels.formatter = ChartkitHandlersDict[ChartkitHandlers.WizardXAxisFormatter];
            }
            if (axisItem?.labels?.formatter === ChartkitHandlers.WizardXAxisEdgeZeroFormatter) {
                axisItem.labels.formatter =
                    ChartkitHandlersDict[ChartkitHandlers.WizardXAxisEdgeZeroFormatter];
            }
        };
        const {tooltipHeaderFormatter} = libraryConfig;

        if (typeof tooltipHeaderFormatter === 'string') {
            libraryConfig.tooltipHeaderFormatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardTooltipHeaderFormatter](
                    tooltipHeaderFormatter,
                );
        }

        if (libraryConfig.legend?.labelFormatter === ChartkitHandlers.WizardLabelFormatter) {
            libraryConfig.legend.labelFormatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardLabelFormatter];
        }

        if (Array.isArray(libraryConfig.xAxis)) {
            libraryConfig.xAxis.forEach((axisItem: any) => {
                applyDatetimeFormatterToXAxisItem(axisItem);
                applyWizardXFormatterToXAxisItem(axisItem);
            });
        } else {
            applyDatetimeFormatterToXAxisItem(libraryConfig.xAxis);
            applyWizardXFormatterToXAxisItem(libraryConfig.xAxis);
        }

        if (
            libraryConfig.yAxis?.labels?.formatter === ChartkitHandlers.WizardDatetimeAxisFormatter
        ) {
            libraryConfig.yAxis.labels.formatter = ChartkitHandlersDict[
                ChartkitHandlers.WizardDatetimeAxisFormatter
            ](libraryConfig.yAxis?.labels?.format);
        }

        libraryConfig.yAxis?.forEach?.((item: typeof libraryConfig.yAxis) => {
            const formatter = item?.labels?.formatter;
            if (formatter && formatter === ChartkitHandlers.WizardDatetimeAxisFormatter) {
                item.labels.formatter = ChartkitHandlersDict[
                    ChartkitHandlers.WizardDatetimeAxisFormatter
                ](item.labels.format);
            }
        });

        if (
            libraryConfig.yAxis?.labels?.formatter === ChartkitHandlers.DCMonitoringLabelFormatter
        ) {
            libraryConfig.yAxis.labels.formatter =
                ChartkitHandlersDict[ChartkitHandlers.DCMonitoringLabelFormatter];
        }

        if (
            libraryConfig.yAxis?.labels?.formatter ===
            ChartkitHandlers.WizardScatterYAxisLabelFormatter
        ) {
            libraryConfig.yAxis.labels.formatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardScatterYAxisLabelFormatter];
        }

        if (
            libraryConfig.exporting?.csv?.columnHeaderFormatter ===
            ChartkitHandlers.WizardExportColumnNamesFormatter
        ) {
            libraryConfig.exporting.csv.columnHeaderFormatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardExportColumnNamesFormatter];
        }

        if (
            libraryConfig.plotOptions?.scatter?.tooltip?.formatter ===
            ChartkitHandlers.WizardScatterTooltipFormatter
        ) {
            delete libraryConfig.plotOptions.scatter.tooltip.formatter;
            libraryConfig.plotOptions.scatter.tooltip.headerFormat = '';
            libraryConfig.plotOptions.scatter.tooltip.pointFormatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardScatterTooltipFormatter];
        }

        if (
            libraryConfig.plotOptions?.treemap?.tooltip?.pointFormatter ===
            ChartkitHandlers.WizardTreemapTooltipFormatter
        ) {
            libraryConfig.plotOptions.treemap.tooltip.pointFormatter =
                ChartkitHandlersDict[ChartkitHandlers.WizardTreemapTooltipFormatter];
        }

        // Final runtime enforcement for flight-load line chart:
        // keep Y scale 0..100 (without 110/120), keep top 100% line visible,
        // and lock strict axis geometry.
        const seriesList: any[] = Array.isArray((libraryConfig as any).series)
            ? ((libraryConfig as any).series as any[])
            : [];
        const thresholdSeries = seriesList.filter((series) => {
            const rawName = String(series?.name ?? series?.legendTitle ?? '')
                .toUpperCase()
                .replace(/\s+/g, ' ')
                .trim();
            const data = Array.isArray(series?.data) ? series.data : [];
            const numericY: number[] = data
                .map((point: any) => (Array.isArray(point) ? Number(point[1]) : Number(point?.y)))
                .filter((v: number) => Number.isFinite(v));
            const isFlatGuideByData =
                numericY.length >= 8 &&
                numericY.every((v: number) => Math.abs(v - numericY[0]) < 0.0001) &&
                [60, 61, 80, 100].some((mark) => Math.abs(numericY[0] - mark) < 0.0001);
            return (
                rawName === 'Y' ||
                /(^|\s)Y(\s|$)/.test(rawName) ||
                rawName.includes('ПКЗ') ||
                ((/60\s*%/.test(rawName) || /61\s*%/.test(rawName)) && rawName.includes('ЗАГ')) ||
                (/80\s*%/.test(rawName) && rawName.includes('ЗАГ')) ||
                (/100\s*%/.test(rawName) && rawName.includes('ЗАГ')) ||
                rawName.includes('%') ||
                rawName.includes('LOAD') ||
                isFlatGuideByData
            );
        });
        const xAxesRaw = Array.isArray((libraryConfig as any).xAxis)
            ? ((libraryConfig as any).xAxis as any[])
            : [((libraryConfig as any).xAxis || {})];
        const isFlightDiffAxisContext = xAxesRaw.some((axis) => {
            const title = String(axis?.title?.text ?? '').toLowerCase();
            return (
                axis?.reversed === true &&
                (title.includes('вылет') ||
                    title.includes('дн') ||
                    String(axis?.labels?.formatter ?? '') === ChartkitHandlers.WizardXAxisFormatter)
            );
        });

        if (
            (thresholdSeries.length > 0 || isFlightDiffAxisContext) &&
            widgetKind !== WidgetKind.GravityCharts
        ) {
            const factualSeries = seriesList.filter((series) => !thresholdSeries.includes(series));
            let factualMax = 0;
            factualSeries.forEach((series) => {
                const data = Array.isArray(series?.data) ? series.data : [];
                data.forEach((point: any) => {
                    const y = Array.isArray(point) ? Number(point[1]) : Number(point?.y);
                    if (Number.isFinite(y)) {
                        factualMax = Math.max(factualMax, y);
                    }
                });
            });
            const boundedMax = 120;
            const tickPositions = Array.from(
                {length: Math.floor(boundedMax / 10) + 1},
                (_, i) => i * 10,
            );

            const yAxes = Array.isArray((libraryConfig as any).yAxis)
                ? ((libraryConfig as any).yAxis as any[])
                : [((libraryConfig as any).yAxis || {})];
            yAxes.forEach((axis) => {
                axis.min = 0;
                axis.max = boundedMax;
                axis.tickInterval = 10;
                axis.tickAmount = tickPositions.length;
                axis.tickPositions = tickPositions;
                axis.startOnTick = false;
                axis.endOnTick = false;
                axis.ceiling = boundedMax <= 100 ? 100 : boundedMax;
                axis.softMax = boundedMax <= 100 ? 100 : boundedMax;
                axis.maxPadding = 0;
                axis.tickLength = 8;
                axis.labels = {
                    ...(axis.labels || {}),
                    y: 3,
                };
            });
            (libraryConfig as any).yAxis = Array.isArray((libraryConfig as any).yAxis)
                ? yAxes
                : yAxes[0];

            const xAxes = xAxesRaw;
            xAxes.forEach((axis) => {
                axis.tickLength = 5;
                axis.labels = {
                    ...(axis.labels || {}),
                    useHTML: true,
                    formatter: ChartkitHandlersDict[ChartkitHandlers.WizardXAxisFormatter],
                    edgeZeroShiftPx: STRICT_ZERO_X_LABEL_SHIFT_PX,
                    edgeZeroVerticalShiftPx: STRICT_ZERO_X_LABEL_VERTICAL_SHIFT_PX,
                };
            });
            (libraryConfig as any).xAxis = Array.isArray((libraryConfig as any).xAxis)
                ? xAxes
                : xAxes[0];
            const existingChart: any = ((libraryConfig as any).chart || {}) as Record<string, unknown>;
            const existingEvents: any = existingChart.events || {};
            const prevLoad = existingEvents.load;
            const prevRender = existingEvents.render;
            (libraryConfig as any).chart = {
                ...existingChart,
                alignTicks: false,
                events: {
                    ...existingEvents,
                    load: function (this: any) {
                        if (typeof prevLoad === 'function') {
                            prevLoad.apply(this, arguments as any);
                        }
                        const yAxis = Array.isArray(this?.yAxis) ? this.yAxis[0] : undefined;
                        if (!yAxis) {
                            return;
                        }
                        const targetMax = 120;
                        const targetTicks = Array.from(
                            {length: Math.floor(targetMax / 10) + 1},
                            (_, i) => i * 10,
                        );
                        yAxis.update(
                            {
                                min: 0,
                                max: targetMax,
                                tickInterval: 10,
                                tickAmount: targetTicks.length,
                                tickPositions: targetTicks,
                                startOnTick: false,
                                endOnTick: false,
                                ceiling: targetMax,
                                softMax: targetMax,
                                maxPadding: 0,
                            },
                            false,
                        );
                        yAxis.setExtremes(0, targetMax, false, false);
                        this.redraw(false);
                    },
                    render: function (this: any) {
                        if (typeof prevRender === 'function') {
                            prevRender.apply(this, arguments as any);
                        }
                        const yAxis = Array.isArray(this?.yAxis) ? this.yAxis[0] : undefined;
                        if (yAxis) {
                            const targetMax = 120;
                            const targetTicks = Array.from(
                                {length: Math.floor(targetMax / 10) + 1},
                                (_, i) => i * 10,
                            );
                            const currentMax = Number(yAxis.max);
                            if (!Number.isFinite(currentMax) || Math.abs(currentMax - targetMax) > 0.0001) {
                                yAxis.update(
                                    {
                                        min: 0,
                                        max: targetMax,
                                        tickInterval: 10,
                                        tickAmount: targetTicks.length,
                                        tickPositions: targetTicks,
                                        startOnTick: false,
                                        endOnTick: false,
                                        ceiling: targetMax,
                                        softMax: targetMax,
                                        maxPadding: 0,
                                    },
                                    false,
                                );
                                yAxis.setExtremes(0, targetMax, false, false);
                                this.redraw(false);
                            }
                        }
                        const prevNodes = Array.isArray(this.__strictZeroXRuntimeNodes)
                            ? this.__strictZeroXRuntimeNodes
                            : [];
                        prevNodes.forEach((node: any) => node?.destroy?.());
                        this.__strictZeroXRuntimeNodes = [];
                        const xAxis = Array.isArray(this?.xAxis) ? this.xAxis[0] : undefined;
                        if (!xAxis || typeof xAxis.toPixels !== 'function') {
                            return;
                        }
                        const ticks = xAxis.ticks ? Object.entries(xAxis.ticks) : [];
                        const rightEdgeX = xAxis.left + xAxis.len;
                        let zeroX: number | null = null;
                        ticks.forEach(([key, tick]: [string, any]) => {
                            const byKey = Number.isFinite(Number(key)) && Math.abs(Number(key)) < 1e-8;
                            const byText =
                                String(tick?.label?.textStr ?? tick?.label?.element?.textContent ?? '').trim() ===
                                '0';
                            const tickPosPx =
                                typeof tick?.pos === 'number' && Number.isFinite(tick.pos)
                                    ? xAxis.toPixels(tick.pos, false)
                                    : Number.isFinite(Number(key))
                                      ? xAxis.toPixels(Number(key), false)
                                      : NaN;
                            const byRightEdge =
                                Number.isFinite(tickPosPx) && Math.abs(tickPosPx - rightEdgeX) < 1.25;
                            if (byKey || byText || byRightEdge) {
                                tick?.mark?.attr?.({opacity: 0});
                                if (tick?.label?.element) {
                                    tick.label.element.style.opacity = '0';
                                }
                                if (zeroX === null) {
                                    const pos = tickPosPx;
                                    if (Number.isFinite(pos)) {
                                        zeroX = pos;
                                    }
                                }
                            }
                        });
                        const x = zeroX ?? xAxis.toPixels(0, false);
                        if (!Number.isFinite(x)) {
                            return;
                        }
                        const y = xAxis.top + xAxis.height;
                        const tickNode = this.renderer
                            .path(['M', x, y, 'L', x, y + STRICT_ZERO_X_TICK_LENGTH_PX])
                            .attr({stroke: xAxis.options?.tickColor || '#333333', 'stroke-width': 1, zIndex: 8})
                            .add();
                        const labelNode = this.renderer
                            .text('0', x + STRICT_ZERO_X_LABEL_DX_PX, y + STRICT_ZERO_X_LABEL_DY_PX)
                            .css({fontSize: '11px', fontWeight: '400', color: '#333333'})
                            .attr({zIndex: 9})
                            .add();
                        this.__strictZeroXRuntimeNodes.push(tickNode, labelNode);

                        // Snap threshold guides to the same visual pixel row as Y grid ticks.
                        const isThresholdGuideSeries = (series: any) => {
                            const rawName = String(
                                series?.name ?? series?.userOptions?.name ?? series?.options?.name ?? '',
                            ).toUpperCase();
                            return (
                                ((/60\s*%/.test(rawName) || /61\s*%/.test(rawName)) &&
                                    rawName.includes('ЗАГ')) ||
                                (/80\s*%/.test(rawName) && rawName.includes('ЗАГ')) ||
                                (/100\s*%/.test(rawName) && rawName.includes('ЗАГ'))
                            );
                        };
                        const chartSeries = Array.isArray(this?.series) ? this.series : [];
                        chartSeries.forEach((series: any) => {
                            if (!isThresholdGuideSeries(series)) {
                                return;
                            }
                            if (series?.graph?.attr) {
                                series.graph.attr({translateY: 0});
                            }
                        });

                        // Threshold guides should stay native Highcharts series to preserve
                        // hover, markers and shared tooltip behavior in editor and dashboard.
                    },
                },
            };
        }
    }

    if (
        config &&
        (config as GraphWidget['config']).manageTooltipConfig ===
            ChartkitHandlers.WizardManageTooltipConfig
    ) {
        (config as GraphWidget['config']).manageTooltipConfig =
            ChartkitHandlersDict[ChartkitHandlers.WizardManageTooltipConfig];
    }
}

export default processNode;
