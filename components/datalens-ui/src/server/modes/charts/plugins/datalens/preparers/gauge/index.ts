import {findIndexInOrder} from '../../utils/misc-helpers';
import type {PrepareFunctionArgs} from '../types';

/**
 * Фаза 2.2: спидометр (Gauge) — один показатель, рендер через Highcharts solidgauge.
 * Возвращает данные в формате графика (graphs) и задаёт конфиг Highcharts для solidgauge.
 */
function prepareGauge({placeholders, resultData, idToTitle, ChartEditor}: PrepareFunctionArgs): {
    graphs: Array<{type: string; data: Array<{y: number; name?: string}>}>;
} {
    const {data, order} = resultData;

    const measure = placeholders[0]?.items?.[0];
    if (typeof measure === 'undefined' || !data?.length) {
        return {graphs: []};
    }

    const measureTitle = idToTitle[measure.guid];
    const measureIndex = findIndexInOrder(order, measure, measureTitle);
    const rawValue = data[0][measureIndex];

    if (rawValue === undefined || rawValue === null) {
        return {graphs: []};
    }

    const numValue = Number(rawValue);
    if (Number.isNaN(numValue)) {
        return {graphs: []};
    }

    ChartEditor.updateHighchartsConfig({
        chart: {type: 'solidgauge'},
        yAxis: [{min: 0, max: 100}],
    });

    const graphs = [
        {
            type: 'solidgauge',
            data: [{y: numValue, name: measureTitle || ''}],
        },
    ];

    return {graphs};
}

export default prepareGauge;
