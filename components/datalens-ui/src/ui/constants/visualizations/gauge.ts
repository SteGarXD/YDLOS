import {ChartPie} from '@gravity-ui/icons';

import type {Shared} from '../../../shared';
import type {IconId} from '../../../shared/types/configs';
import {prepareFieldToMeasureTransformation} from '../../units/wizard/utils/visualization';
import {ITEM_TYPES, PRIMITIVE_DATA_TYPES_AND_MARKUP} from '../misc';

/** Фаза 2.2: спидометр (Gauge) — один показатель, min/max, пороги/цвета (Highcharts solidgauge) */
export const GAUGE_VISUALIZATION = {
    id: 'gauge',
    type: 'gauge',
    name: 'label_visualization-gauge',
    iconProps: {id: 'visGauge' as IconId, width: '24'},
    allowFilters: true,
    allowLabels: false,
    allowSort: false,
    placeholders: [
        {
            allowedTypes: ITEM_TYPES.DIMENSIONS_AND_MEASURES,
            allowedFinalTypes: ITEM_TYPES.MEASURES,
            allowedDataTypes: PRIMITIVE_DATA_TYPES_AND_MARKUP,
            id: 'measures',
            type: 'measures',
            title: 'section_measure',
            iconProps: {data: ChartPie},
            items: [],
            required: true,
            capacity: 1,
            transform: prepareFieldToMeasureTransformation,
        },
    ],
} as Shared['visualization'];
