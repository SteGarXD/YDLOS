import set from 'lodash/set';

import {getFakeTitleOrTitle, isHtmlField} from '../../../../../../../shared';
import {getHighchartsGradientStops} from '../../utils/get-gradient-stops';
import {isLegendEnabled} from '../../utils/misc-helpers';
import {
    getVisualizationCustomizationBehaviorFlags,
    resolveVisualizationCustomizationProfile,
} from '../helpers/customization-profile';
import type {PrepareFunctionArgs} from '../types';

import preparePieData from './prepare-pie-data';
import {isColoringByMeasure} from './utils';

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

/** Эталон дашборда 7: сектора заметно отходят от центра */
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

export function prepareHighchartsPie(args: PrepareFunctionArgs) {
    const {ChartEditor, colorsConfig, labels, shared} = args;
    const {graphs, totals, measure, label, color, dimension} = preparePieData(args);
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

    const labelsLength = labels && labels.length;
    const isHideLabel = measure?.hideLabelMode === 'hide';

    const customConfig: Record<string, any> = {
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: Boolean(labelsLength && label && !isHideLabel),
                },
            },
        },
        legend: {
            enabled: isLegendEnabled(shared.extraSettings),
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical',
        },
    };

    const pie = graphs[0];

    if (pie && pie.data) {
        const radialOffset =
            typeof customization.slicedOffset === 'number'
                ? customization.slicedOffset
                : typeof customization.pointOffset === 'number'
                  ? customization.pointOffset
                  : enablePieDistributionPreset
                    ? PROFILE_PIE_SLICE_OFFSET
                  : undefined;
        if (enablePieDistributionPreset) {
            (pie as unknown as Record<string, unknown>).legendSymbol = 'rectangle';
        }
        (pie.data as unknown as Array<Record<string, unknown>>).forEach((point) => {
            point.sliced = true;
            if (enablePieDistributionPreset) {
                const profileColor =
                    getBookingClassDistributionColor(point.name) ||
                    getBookingClassDistributionColor(point.colorValue) ||
                    getBookingClassDistributionColor(point.label);
                if (profileColor) {
                    point.color = profileColor;
                }
                point.legendSymbol = 'rectangle';
            }
            if (typeof radialOffset === 'number') {
                point.slicedOffset = radialOffset;
            }
        });

        if (isColoringByMeasure(args)) {
            pie.showInLegend = false;

            const colorValues = pie.data.map((point) => Number(point.colorValue));
            const points = pie.data as unknown as Highcharts.PointOptionsObject[];

            const minColorValue = Math.min(...colorValues);
            const maxColorValue = Math.max(...colorValues);

            customConfig.colorAxis = {
                startOnTick: false,
                endOnTick: false,
                min: minColorValue,
                max: maxColorValue,
                stops: getHighchartsGradientStops({
                    colorsConfig,
                    points,
                    minColorValue,
                    maxColorValue,
                }),
            };

            customConfig.legend = {
                title: {
                    text: getFakeTitleOrTitle(color),
                },
                enabled: isLegendEnabled(shared.extraSettings),
                symbolWidth: null,
            };
        }
    }

    const shouldUseHtmlForLegend = [dimension, color].some(isHtmlField);
    if (shouldUseHtmlForLegend) {
        set(customConfig, 'legend.useHTML', true);
    }
    customConfig.legend = {
        ...(customConfig.legend || {}),
        enabled: isLegendEnabled(shared.extraSettings),
        align: legendCustomization.position === 'bottom' ? 'center' : 'right',
        verticalAlign: legendCustomization.position === 'bottom' ? 'bottom' : 'top',
        layout: legendCustomization.position === 'bottom' ? 'horizontal' : 'vertical',
        squareSymbol: enablePieDistributionPreset || legendCustomization.symbolType !== 'circle',
        symbolWidth: enablePieDistributionPreset ? 34 : (legendCustomization.symbolWidth ?? 14),
        symbolHeight: enablePieDistributionPreset ? 9 : (legendCustomization.symbolHeight ?? 4),
        symbolRadius:
            !enablePieDistributionPreset && legendCustomization.symbolType === 'circle'
                ? Math.max(1, Math.floor((legendCustomization.symbolHeight ?? 4) / 2))
                : 0,
        symbolPadding: enablePieDistributionPreset ? 8 : (legendCustomization.symbolPadding ?? 8),
        itemMarginBottom: 4,
        itemDistance: enablePieDistributionPreset ? 18 : legendCustomization.itemDistance,
        itemStyle: {
            fontSize: legendCustomization.itemFontSize ?? '12px',
        },
    };
    customConfig.plotOptions = {
        ...(customConfig.plotOptions || {}),
        pie: {
            ...((customConfig.plotOptions || {}).pie || {}),
            legendSymbol:
                !enablePieDistributionPreset && legendCustomization.symbolType === 'circle'
                    ? 'circle'
                    : 'rectangle',
            slicedOffset:
                customization.slicedOffset ?? (enablePieDistributionPreset ? PROFILE_PIE_SLICE_OFFSET : 14),
            borderWidth:
                customization.borderWidth ?? (enablePieDistributionPreset ? PROFILE_PIE_BORDER_WIDTH : 0),
            borderColor:
                customization.borderColor ?? (enablePieDistributionPreset ? '#ffffff' : 'transparent'),
            borderJoin: 'round',
        },
    };
    if (
        typeof customization.titleFontSize === 'number' ||
        typeof customization.titleFontWeight === 'string' ||
        enablePieDistributionPreset
    ) {
        customConfig.title = {
            ...(customConfig.title || {}),
            style: {
                ...((customConfig.title || {}).style || {}),
                fontSize: `${customization.titleFontSize ?? 18}px`,
                fontWeight: customization.titleFontWeight ?? '700',
            },
        };
    }

    ChartEditor.updateHighchartsConfig(customConfig);

    return {graphs, totals};
}
