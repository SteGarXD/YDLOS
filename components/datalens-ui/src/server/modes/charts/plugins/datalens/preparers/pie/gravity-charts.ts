import type {ChartData, PieSeries, PieSeriesData} from '@gravity-ui/chartkit/gravity-charts';
import merge from 'lodash/merge';

import type {SeriesExportSettings} from '../../../../../../../shared';
import {formatNumber, getFormatOptions, isMeasureValue} from '../../../../../../../shared';
import {getFakeTitleOrTitle} from '../../../../../../../shared/modules/fields';
import {isHtmlField, isMarkdownField, isMarkupField} from '../../../../../../../shared/types/index';
import {getBaseChartConfig} from '../../gravity-charts/utils';
import {getFieldFormatOptions} from '../../gravity-charts/utils/format';
import {getExportColumnSettings} from '../../utils/export-helpers';
import {getLegendColorScale} from '../helpers/legend';
import {
    getVisualizationCustomizationBehaviorFlags,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import type {PiePoint, PrepareFunctionArgs} from '../types';

import preparePieData from './prepare-pie-data';
import {getFormattedValue, isColoringByMeasure, isDonut} from './utils';

type ExtendedPieSeriesData = Omit<PieSeriesData, 'label'> & {
    drillDownFilterValue?: string;
    formattedValue: string | null;
    percentage: number;
    label?: PiePoint['label'];
    offset?: number;
    sliced?: boolean;
};

type ExtendedPieSeries = Omit<PieSeries, 'data'> & {
    custom?: {
        totals?: string;
        exportSettings?: SeriesExportSettings;
        explodedPie?: boolean;
        explodedPieOffset?: number;
    };
    data: ExtendedPieSeriesData[];
};

const BOOKING_CLASS_DISTRIBUTION_COLORS: Record<string, string> = {
    Ж: '#4285e8',
    Я: '#0059d9',
    Н: '#f5b041',
    Ц: '#f4cf74',
    Ю: '#e53800',
    Х: '#4e617a',
    В: '#006f97',
    Б: '#e9b49f',
    А: '#c0c0c0',
    Ы: '#de8708',
    Е: '#173b73',
    Д: '#5b83bc',
    О: '#ffe276',
    Ш: '#ff9f2a',
    Э: '#26a7df',
    П: '#95c5e8',
    Л: '#c96a47',
    У: '#e53200',
    H: '#4285e8',
    Q: '#f5b041',
    K: '#e53800',
    V: '#006f97',
    U: '#c0c0c0',
    L: '#173b73',
    G: '#ffe276',
    Y: '#26a7df',
    N: '#c96a47',
    T: '#0059d9',
    M: '#f4cf74',
    C: '#4e617a',
    X: '#e9b49f',
    J: '#de8708',
};

const PROFILE_PIE_SLICE_OFFSET = 26;
const PROFILE_PIE_BORDER_WIDTH = 1;

function getBookingClassDistributionColor(rawValue: unknown): string | undefined {
    const key = String(rawValue ?? '').trim();
    return BOOKING_CLASS_DISTRIBUTION_COLORS[key];
}

function getPieFieldHints(field?: {fakeTitle?: unknown; title?: unknown; guid?: unknown} | null) {
    return [
        String(field?.fakeTitle ?? ''),
        String(field?.title ?? ''),
        String(field?.guid ?? ''),
    ];
}

export function prepareD3Pie(args: PrepareFunctionArgs) {
    const {shared, labels, visualizationId, ChartEditor, colorsConfig, idToDataType} = args;
    const {graphs, label, measure, totals, color, dimension} = preparePieData(args);
    const customization = (shared.extraSettings as any)?.customization?.pie || {};
    const legendCustomization = customization.legend || {};
    const customizationProfile = resolveVisualizationCustomizationProfile({
        extraSettings: shared.extraSettings as Record<string, unknown>,
        titleHints: [
            String((shared as any).title ?? ''),
            ...getPieFieldHints(measure),
            ...getPieFieldHints(label),
            ...getPieFieldHints(dimension),
            ...getPieFieldHints(color),
        ],
        headerFieldHints: [measure, label, dimension, color].flatMap(getPieFieldHints),
    });
    const {enablePieDistributionPreset} =
        getVisualizationCustomizationBehaviorFlags(customizationProfile);
    const isLabelsEnabled = Boolean(labels?.length && label && measure?.hideLabelMode !== 'hide');

    const shouldUseHtmlForLabels =
        isMarkupField(label) || isHtmlField(label) || isMarkdownField(label);
    const labelField = isMeasureValue(label) ? measure : label;

    let data: ExtendedPieSeries[] = [];

    if (measure && graphs.length > 0) {
        const graph = graphs[0];
        const total = graph.data?.reduce((sum, d) => sum + (d.y || 0), 0) ?? 0;
        const labelFormatting = labelField ? getFormatOptions(labelField) : undefined;
        const seriesConfig: ExtendedPieSeries = {
            type: 'pie',
            // Baseline: доля минимального радиуса относительно области графика (не «дыра» как у donut).
            minRadius: '50%',
            dataLabels: {
                enabled: isLabelsEnabled,
                html: shouldUseHtmlForLabels,
                format: isLabelsEnabled ? getFieldFormatOptions({field: labelField}) : undefined,
            },
            data:
                graph.data?.map((item) => {
                    const percentage = item.y / total;
                    const profileColor =
                        enablePieDistributionPreset &&
                        (getBookingClassDistributionColor(item.name) ||
                            getBookingClassDistributionColor(item.colorValue) ||
                            getBookingClassDistributionColor(item.label));
                    return {
                        ...item,
                        value: item.y,
                        color: profileColor || item.color,
                        formattedValue: getFormattedValue(String(item.y), {
                            ...measure,
                            data_type: idToDataType[measure.guid],
                        }),
                        percentage,
                        label: labelFormatting?.labelMode === 'percent' ? percentage : item.label,
                        offset: enablePieDistributionPreset
                            ? customization.slicedOffset ??
                              customization.pointOffset ??
                              PROFILE_PIE_SLICE_OFFSET
                            : customization.pointOffset ?? 14,
                        sliced: true,
                    };
                }) ?? [],
            legend: {
                symbol: {
                    shape: enablePieDistributionPreset
                        ? ('rect' as const)
                        : !enablePieDistributionPreset &&
                            legendCustomization.symbolType === 'circle'
                          ? ('symbol' as const)
                          : ('rect' as const),
                    symbolType:
                        !enablePieDistributionPreset &&
                        legendCustomization.symbolType === 'circle'
                            ? ('circle' as const)
                            : undefined,
                    padding: enablePieDistributionPreset ? 8 : (legendCustomization.symbolPadding ?? 8),
                    width: enablePieDistributionPreset
                        ? 34
                        : (legendCustomization.symbolWidth ?? 14),
                    height: enablePieDistributionPreset
                        ? 9
                        : (legendCustomization.symbolHeight ?? 4),
                    radius:
                        !enablePieDistributionPreset && legendCustomization.symbolType === 'circle'
                            ? Math.max(1, Math.floor((legendCustomization.symbolHeight ?? 4) / 2))
                            : 0,
                } as Record<string, unknown>,
            },
        };
        (seriesConfig as any).slicedOffset =
            customization.slicedOffset ?? (enablePieDistributionPreset ? PROFILE_PIE_SLICE_OFFSET : 16);
        (seriesConfig as any).borderWidth =
            customization.borderWidth ?? (enablePieDistributionPreset ? PROFILE_PIE_BORDER_WIDTH : 0);
        (seriesConfig as any).borderColor =
            customization.borderColor ?? (enablePieDistributionPreset ? '#ffffff' : 'transparent');

        seriesConfig.custom = {
            ...(enablePieDistributionPreset
                ? {
                      explodedPie: true,
                      explodedPieOffset:
                          customization.slicedOffset ??
                          customization.pointOffset ??
                          PROFILE_PIE_SLICE_OFFSET,
                  }
                : {}),
            exportSettings: {
                columns: [
                    {
                        name: ChartEditor.getTranslation('chartkit.data-provider', 'categories'),
                        field: 'name',
                    },
                    getExportColumnSettings({path: 'value', field: measure}),
                ],
            },
        };

        if (isDonut({visualizationId})) {
            seriesConfig.innerRadius = '50%';

            if (measure && totals) {
                seriesConfig.custom = {
                    ...seriesConfig.custom,
                    totals: formatNumber(Number(totals), getFormatOptions(measure)),
                };
            }
        }

        data.push(seriesConfig);
    } else {
        data = [];
    }

    let legend: ChartData['legend'] = {};
    if (graphs.length && isColoringByMeasure(args)) {
        const points = graphs
            .map((graph) => (graph.data ?? []).map((d) => ({colorValue: d.colorValue as unknown})))
            .flat(2);

        const colorScale = getLegendColorScale({
            colorsConfig,
            points,
        });

        legend = {
            enabled: true,
            type: 'continuous',
            title: {text: getFakeTitleOrTitle(measure), style: {fontWeight: '500'}},
            colorScale,
        };
    } else {
        const shouldUseHtmlForLegend = [dimension, color].some(isHtmlField);
        legend = {
            ...legend,
            enabled: shared.extraSettings?.legendMode !== 'hide',
            position: legendCustomization.position ?? 'right',
            width: legendCustomization.width ?? (enablePieDistributionPreset ? 210 : 170),
            margin: legendCustomization.margin ?? 8,
            itemDistance: legendCustomization.itemDistance ?? (enablePieDistributionPreset ? 18 : undefined),
            itemStyle: {
                fontSize: legendCustomization.itemFontSize ?? '12px',
                fontColor: '#000000',
            },
        };
        if (shouldUseHtmlForLegend) {
            legend = {...legend, html: true};
        }
    }

    return merge(getBaseChartConfig(shared), {
        chart: {
            margin: {top: 20, left: 12, right: 12, bottom: 20},
            zoom: {enabled: false},
        },
        ...(typeof customization.titleFontSize === 'number' ||
        typeof customization.titleFontWeight === 'string' ||
        enablePieDistributionPreset
            ? {
                  title: {
                      style: {
                          fontSize: `${customization.titleFontSize ?? 18}px`,
                          fontWeight: customization.titleFontWeight ?? '700',
                      },
                  },
              }
            : {}),
        series: {
            data: data.filter((s) => s.data.length),
            ...(enablePieDistributionPreset
                ? {
                      options: {
                          pie: {
                              states: {
                                  hover: {
                                      halo: {
                                          enabled: false,
                                      },
                                  },
                              },
                          },
                      },
                  }
                : {}),
        },
        legend,
    });
}
